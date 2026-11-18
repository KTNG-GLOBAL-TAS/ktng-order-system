/**
 * Price & discount ledger — database operations.
 *
 * Every rule that must hold whatever the browser sends lives here: one product per code, one SAP order per number, one
 * standard distributor, a product / distributor used in orders is never deleted, a bulk price change is computed from the
 * stored prices (calc.changeCalc) and cancelled as a whole.
 */
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import {
  DEFAULT_CONFIG,
  LedgerConfig,
  LedgerPriceDoc,
  LedgerProductDoc,
  changeCalc,
  isNum,
  rnd,
} from './calc';

export class LedgerError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public params: Record<string, unknown> = {}
  ) {
    super(message);
  }
}

const CONFIG_KEY = 'ledger.config';
const DATE_RX = /^\d{4}-\d{2}-\d{2}$/;

function toDate(value: unknown, field: string): Date {
  const s = String(value ?? '');
  const d = DATE_RX.test(s) ? new Date(`${s}T00:00:00.000Z`) : new Date(NaN);
  if (isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) {
    throw new LedgerError('bad_date', `${field}: a date as YYYY-MM-DD is required.`);
  }
  return d;
}

const fromDate = (d: Date): string => d.toISOString().slice(0, 10);

/** Today's date in Tashkent (UTC+5, no daylight saving). */
export const todayTashkent = (): string => new Date(Date.now() + 5 * 3600 * 1000).toISOString().slice(0, 10);

function text(value: unknown, max: number): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function numberOrNull(value: unknown, field: string, min = 0): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!isFinite(n) || n < min) throw new LedgerError('bad_number', `${field}: a number of ${min} or more is required.`);
  return n;
}

function positive(value: unknown, field: string): number {
  const n = Number(value);
  if (!isFinite(n) || !(n > 0)) throw new LedgerError('bad_number', `${field}: a number above 0 is required.`);
  return n;
}

/* ───────────── configuration ───────────── */

export async function getConfig(): Promise<LedgerConfig> {
  const row = await prisma.systemSetting.findUnique({ where: { key: CONFIG_KEY } });
  const cfg: LedgerConfig = { ...DEFAULT_CONFIG };
  if (row) {
    try {
      const saved = JSON.parse(row.value);
      for (const k of Object.keys(DEFAULT_CONFIG) as (keyof LedgerConfig)[]) {
        if (isNum(saved?.[k])) cfg[k] = saved[k];
      }
    } catch {
      // an unreadable value: the defaults
    }
  }
  return cfg;
}

export async function saveConfig(input: any): Promise<LedgerConfig> {
  const cfg = {} as LedgerConfig;
  for (const k of Object.keys(DEFAULT_CONFIG) as (keyof LedgerConfig)[]) {
    const n = Number(input?.[k]);
    if (!isFinite(n) || n < 0) throw new LedgerError('bad_config', 'Every setting must be a number of 0 or more.');
    cfg[k] = n;
  }
  if (!(cfg.roundUnit >= 1)) throw new LedgerError('bad_config', 'The rounding unit must be 1 or more.');
  await prisma.systemSetting.upsert({
    where: { key: CONFIG_KEY },
    create: { key: CONFIG_KEY, value: JSON.stringify(cfg) },
    update: { value: JSON.stringify(cfg) },
  });
  return cfg;
}

/* ───────────── the whole state, as the page reads it ───────────── */

type ProductRow = Prisma.LedgerProductGetPayload<{}>;
type PriceRow = Prisma.LedgerPriceGetPayload<{}>;

const productDoc = (p: ProductRow): LedgerProductDoc & Record<string, unknown> => ({
  id: p.id,
  code: p.code,
  name: p.name,
  unit: p.unit,
  distRate: p.distRate,
  consRate: p.consRate,
  distFixed: p.distFixed,
  consFixed: p.consFixed,
  active: p.isActive,
  ...(p.isSample ? { sample: true } : {}),
  linked: Boolean(p.productId),
  updatedBy: p.updatedById,
  updatedAt: p.updatedAt.toISOString(),
});

const priceDoc = (p: PriceRow): LedgerPriceDoc => ({
  id: p.id,
  productId: p.productId,
  supplyNet: p.supplyNet,
  validFrom: fromDate(p.validFrom),
  changeId: p.changeId,
  note: p.note,
  createdAt: p.createdAt.toISOString(),
  createdBy: p.createdById,
  ...(p.isSample ? { sample: true } : {}),
});

export async function getState() {
  const [products, prices, distributors, changes, orders, config] = await Promise.all([
    prisma.ledgerProduct.findMany(),
    prisma.ledgerPrice.findMany(),
    prisma.ledgerDistributor.findMany(),
    prisma.ledgerPriceChange.findMany(),
    prisma.ledgerOrder.findMany({ include: { lines: { orderBy: { position: 'asc' } } } }),
    getConfig(),
  ]);
  const userIds = new Set<string>();
  for (const x of products) if (x.updatedById) userIds.add(x.updatedById);
  for (const x of prices) if (x.createdById) userIds.add(x.createdById);
  for (const x of changes) if (x.createdById) userIds.add(x.createdById);
  for (const x of orders) if (x.updatedById) userIds.add(x.updatedById);
  const users = userIds.size
    ? await prisma.user.findMany({ where: { id: { in: [...userIds] } }, select: { id: true, name: true } })
    : [];
  return {
    config,
    products: products.map(productDoc),
    prices: prices.map(priceDoc),
    distributors: distributors.map(d => ({
      id: d.id,
      name: d.name,
      isStandard: d.isStandard,
      refRate: d.refRate,
      note: d.note,
      ...(d.isSample ? { sample: true } : {}),
      linked: Boolean(d.companyId),
      updatedBy: d.updatedById,
      updatedAt: d.updatedAt.toISOString(),
    })),
    changes: changes.map(c => ({
      id: c.id,
      title: c.title,
      date: fromDate(c.date),
      dir: c.dir,
      method: c.method,
      value: c.value,
      adjustFixed: c.adjustFixed,
      count: c.count,
      createdAt: c.createdAt.toISOString(),
      createdBy: c.createdById,
      ...(c.isSample ? { sample: true } : {}),
    })),
    orders: orders.map(o => ({
      id: o.id,
      orderNo: o.orderNo || '',
      date: fromDate(o.date),
      distributorId: o.distributorId,
      basis: o.basis === 'gross' ? 'gross' : 'net',
      note: o.note,
      lines: o.lines.map(l => ({ productId: l.productId, qty: l.qty, amount: l.amount })),
      updatedBy: o.updatedById,
      updatedAt: o.updatedAt.toISOString(),
      createdAt: o.createdAt.toISOString(),
      ...(o.isSample ? { sample: true } : {}),
    })),
    names: Object.fromEntries(users.map(u => [u.id, u.name])),
  };
}

/* ───────────── products and base prices ───────────── */

function productFields(input: any) {
  const code = text(input?.code, 60);
  const name = text(input?.name, 200);
  if (!code || !name) throw new LedgerError('required', 'The product code and name are required.');
  return {
    code,
    codeKey: code.toLowerCase(),
    name,
    unit: text(input?.unit, 40),
    distRate: numberOrNull(input?.distRate, 'distRate'),
    consRate: numberOrNull(input?.consRate, 'consRate'),
    distFixed: numberOrNull(input?.distFixed, 'distFixed'),
    consFixed: numberOrNull(input?.consFixed, 'consFixed'),
  };
}

async function assertCodeFree(codeKey: string, exceptId?: string) {
  const other = await prisma.ledgerProduct.findUnique({ where: { codeKey } });
  if (other && other.id !== exceptId) throw new LedgerError('dup_code', 'This product code is already registered.', 409, { code: other.code });
}

/** The catalog product of the ordering system with this SKU, if any (the link is informational). */
async function catalogProductId(code: string): Promise<string | null> {
  const hit = await prisma.product.findFirst({ where: { sku: { equals: code, mode: 'insensitive' } }, select: { id: true } });
  return hit?.id ?? null;
}

export async function createProduct(input: any, userId: string) {
  const fields = productFields(input);
  const supplyNet = positive(input?.firstPrice?.supplyNet, 'firstPrice.supplyNet');
  const validFrom = toDate(input?.firstPrice?.validFrom, 'firstPrice.validFrom');
  await assertCodeFree(fields.codeKey);
  const productId = await catalogProductId(fields.code);
  const created = await prisma.$transaction(async tx => {
    const product = await tx.ledgerProduct.create({ data: { ...fields, isActive: true, productId, updatedById: userId } });
    await tx.ledgerPrice.create({
      data: { productId: product.id, supplyNet, validFrom, note: text(input?.firstPrice?.note, 200), createdById: userId },
    });
    return product;
  });
  return { id: created.id };
}

export async function updateProduct(id: string, input: any, userId: string) {
  const prev = await prisma.ledgerProduct.findUnique({ where: { id } });
  if (!prev) throw new LedgerError('not_found', 'The product was not found.', 404);
  const fields = productFields(input);
  await assertCodeFree(fields.codeKey, id);
  const productId = fields.codeKey === prev.codeKey ? prev.productId : await catalogProductId(fields.code);
  await prisma.ledgerProduct.update({
    where: { id },
    data: { ...fields, isActive: input?.active !== false, productId, updatedById: userId },
  });
  return { id };
}

export async function deleteProduct(id: string) {
  const used = await prisma.ledgerOrder.count({ where: { lines: { some: { productId: id } } } });
  if (used) throw new LedgerError('in_use', 'The product is used in orders and cannot be deleted.', 409, { n: used });
  await prisma.ledgerProduct.deleteMany({ where: { id } }); // its prices go with it (cascade)
  return { id };
}

export async function createPrice(input: any, userId: string) {
  const product = await prisma.ledgerProduct.findUnique({ where: { id: String(input?.productId ?? '') } });
  if (!product) throw new LedgerError('not_found', 'The product was not found.', 404);
  const price = await prisma.ledgerPrice.create({
    data: {
      productId: product.id,
      supplyNet: positive(input?.supplyNet, 'supplyNet'),
      validFrom: toDate(input?.validFrom, 'validFrom'),
      note: text(input?.note, 200),
      isSample: product.isSample,
      createdById: userId,
    },
  });
  return { id: price.id };
}

export async function deletePrice(id: string) {
  const price = await prisma.ledgerPrice.findUnique({ where: { id } });
  if (!price) throw new LedgerError('not_found', 'The price was not found.', 404);
  if (price.changeId) throw new LedgerError('change_price', 'A price created by a bulk change is removed by cancelling that change.', 409);
  await prisma.ledgerPrice.delete({ where: { id } });
  return { id, productId: price.productId };
}

/* ───────────── distributors ───────────── */

export async function saveDistributor(id: string | null, input: any, userId: string) {
  const name = text(input?.name, 200);
  if (!name) throw new LedgerError('required', 'The distributor name is required.');
  const data = {
    name,
    isStandard: input?.isStandard === true,
    refRate: numberOrNull(input?.refRate, 'refRate'),
    note: text(input?.note, 300),
    updatedById: userId,
  };
  const saved = await prisma.$transaction(async tx => {
    let row;
    if (id) {
      const prev = await tx.ledgerDistributor.findUnique({ where: { id } });
      if (!prev) throw new LedgerError('not_found', 'The distributor was not found.', 404);
      row = await tx.ledgerDistributor.update({ where: { id }, data });
    } else {
      const company = await tx.company.findFirst({ where: { name: { equals: name, mode: 'insensitive' } }, select: { id: true } });
      row = await tx.ledgerDistributor.create({ data: { ...data, companyId: company?.id ?? null } });
    }
    if (data.isStandard) {
      await tx.ledgerDistributor.updateMany({ where: { id: { not: row.id }, isStandard: true }, data: { isStandard: false } });
    }
    return row;
  });
  return { id: saved.id };
}

export async function deleteDistributor(id: string) {
  const used = await prisma.ledgerOrder.count({ where: { distributorId: id } });
  if (used) throw new LedgerError('in_use', 'The distributor has orders and cannot be deleted.', 409, { n: used });
  await prisma.ledgerDistributor.deleteMany({ where: { id } });
  return { id };
}

/* ───────────── SAP orders ───────────── */

export async function saveOrder(id: string | null, input: any, userId: string) {
  const orderNo = text(input?.orderNo, 60) || null;
  const date = toDate(input?.date, 'date');
  const distributorId = String(input?.distributorId ?? '');
  const basis = input?.basis === 'gross' ? 'gross' : 'net';
  const rawLines: any[] = Array.isArray(input?.lines) ? input.lines : [];
  if (!rawLines.length) throw new LedgerError('no_lines', 'At least one product line is required.');
  if (rawLines.length > 500) throw new LedgerError('too_many_lines', 'An order holds at most 500 lines.');
  const lines = rawLines.map((l, i) => {
    const qty = Number(l?.qty);
    const amount = Number(l?.amount);
    if (!l?.productId || !(qty > 0) || !isFinite(amount) || amount < 0) {
      throw new LedgerError('bad_line', `Line ${i + 1}: a product, a quantity above 0 and an amount are required.`, 400, { n: i + 1 });
    }
    return { productId: String(l.productId), qty, amount, position: i };
  });
  const [distributor, known] = await Promise.all([
    prisma.ledgerDistributor.findUnique({ where: { id: distributorId }, select: { id: true } }),
    prisma.ledgerProduct.findMany({ where: { id: { in: [...new Set(lines.map(l => l.productId))] } }, select: { id: true } }),
  ]);
  if (!distributor) throw new LedgerError('not_found', 'The distributor was not found.', 404);
  const knownIds = new Set(known.map(p => p.id));
  const missing = lines.findIndex(l => !knownIds.has(l.productId));
  if (missing >= 0) throw new LedgerError('bad_line', `Line ${missing + 1}: the product was not found.`, 400, { n: missing + 1 });
  if (orderNo) {
    const other = await prisma.ledgerOrder.findUnique({ where: { orderNo }, select: { id: true } });
    if (other && other.id !== id) throw new LedgerError('dup_order', 'This SAP order number is already registered.', 409, { n: orderNo });
  }
  const head = { orderNo, date, distributorId, basis, note: text(input?.note, 300), updatedById: userId };
  try {
    const saved = await prisma.$transaction(async tx => {
      let row;
      if (id) {
        const prev = await tx.ledgerOrder.findUnique({ where: { id }, select: { id: true } });
        if (!prev) throw new LedgerError('not_found', 'The order was not found.', 404);
        row = await tx.ledgerOrder.update({ where: { id }, data: head });
        await tx.ledgerOrderLine.deleteMany({ where: { orderId: id } });
      } else {
        row = await tx.ledgerOrder.create({ data: { ...head, createdById: userId } });
      }
      await tx.ledgerOrderLine.createMany({ data: lines.map(l => ({ ...l, orderId: row.id })) });
      return row;
    });
    return { id: saved.id };
  } catch (err: any) {
    if (err?.code === 'P2002') throw new LedgerError('dup_order', 'This SAP order number is already registered.', 409, { n: orderNo });
    throw err;
  }
}

export async function deleteOrder(id: string) {
  await prisma.ledgerOrder.deleteMany({ where: { id } });
  return { id };
}

/* ───────────── bulk price changes ───────────── */

export async function applyChange(input: any, userId: string) {
  const title = text(input?.title, 200);
  if (!title) throw new LedgerError('required', 'The title of the price change is required.');
  const date = toDate(input?.date, 'date');
  const form = {
    date: fromDate(date),
    dir: input?.dir === 'down' ? ('down' as const) : ('up' as const),
    method: input?.method === 'amt' ? ('amt' as const) : ('pct' as const),
    value: positive(input?.value, 'value'),
    adjustFixed: input?.adjustFixed === true,
  };
  const ids: string[] = Array.isArray(input?.ids) ? input.ids.map(String) : [];
  const [cfg, productRows, priceRows] = await Promise.all([
    getConfig(),
    input?.scope === 'sel'
      ? prisma.ledgerProduct.findMany({ where: { id: { in: ids } } })
      : prisma.ledgerProduct.findMany({ where: { isActive: true } }),
    prisma.ledgerPrice.findMany(),
  ]);
  const rows = changeCalc(form, productRows.map(productDoc), priceRows.map(priceDoc), cfg).filter(r => !r.skip && r.next != null);
  if (!rows.length) throw new LedgerError('no_targets', 'No product has a base price in force on that date.');
  if (rows.some(r => !((r.next as number) > 0))) throw new LedgerError('neg_price', 'The change would make a price zero or negative.');
  const sample = new Map(productRows.map(p => [p.id, p.isSample]));
  const fixedBefore: Record<string, { distFixed: number | null; consFixed: number | null }> = {};
  const created = await prisma.$transaction(async tx => {
    const change = await tx.ledgerPriceChange.create({
      data: { title, date, dir: form.dir, method: form.method, value: form.value, adjustFixed: form.adjustFixed, count: rows.length, createdById: userId },
    });
    await tx.ledgerPrice.createMany({
      data: rows.map(r => ({
        productId: r.product.id,
        supplyNet: r.next as number,
        validFrom: date,
        changeId: change.id,
        note: title,
        isSample: sample.get(r.product.id) === true,
        createdById: userId,
      })),
    });
    for (const r of rows.filter(x => x.fixedChanged)) {
      fixedBefore[r.product.id] = { distFixed: r.product.distFixed ?? null, consFixed: r.product.consFixed ?? null };
      await tx.ledgerProduct.update({
        where: { id: r.product.id },
        data: { distFixed: r.distFixed ?? null, consFixed: r.consFixed ?? null, updatedById: userId },
      });
    }
    if (Object.keys(fixedBefore).length) {
      await tx.ledgerPriceChange.update({ where: { id: change.id }, data: { fixedBefore } });
    }
    return change;
  });
  return { id: created.id, count: rows.length };
}

/** Cancels a bulk change as a whole: its prices are deleted, the fixed amounts it moved are put back. */
export async function cancelChange(id: string, userId: string) {
  const change = await prisma.ledgerPriceChange.findUnique({ where: { id } });
  if (!change) throw new LedgerError('not_found', 'The price change was not found.', 404);
  const before = (change.fixedBefore ?? {}) as Record<string, { distFixed?: number | null; consFixed?: number | null }>;
  await prisma.$transaction(async tx => {
    for (const [productId, v] of Object.entries(before)) {
      await tx.ledgerProduct.updateMany({
        where: { id: productId },
        data: { distFixed: v?.distFixed ?? null, consFixed: v?.consFixed ?? null, updatedById: userId },
      });
    }
    await tx.ledgerPriceChange.delete({ where: { id } }); // its prices go with it (cascade)
  });
  return { id };
}

/* ───────────── sample data ───────────── */

export async function loadSample(input: any, userId: string) {
  const L = (k: string, fallback: string) => text(input?.labels?.[k], 120) || fallback;
  const month = /^\d{4}-\d{2}$/.test(String(input?.month ?? '')) ? String(input.month) : todayTashkent().slice(0, 7);
  const cfg = await getConfig();
  const defs: [string, string, string, number, number | null][] = [
    ['EX-001', L('prodA', 'Sample product A'), L('unitPack', 'pack'), 15000, null],
    ['EX-002', L('prodB', 'Sample product B'), L('unitPack', 'pack'), 18000, null],
    ['EX-003', L('prodC', 'Sample product C'), L('unitCarton', 'carton'), 150000, 12],
  ];
  const taken = await prisma.ledgerProduct.count({ where: { codeKey: { in: defs.map(d => d[0].toLowerCase()) } } });
  const takenOrders = await prisma.ledgerOrder.count({ where: { orderNo: { in: ['EX-4500001', 'EX-4500002'] } } });
  if (taken || takenOrders) throw new LedgerError('sample_exists', 'The sample data is already loaded.', 409);
  const first = toDate('2026-01-01', 'date');
  const raised = toDate('2026-09-01', 'date');
  await prisma.$transaction(async tx => {
    const change = await tx.ledgerPriceChange.create({
      data: { title: L('changeTitle', 'Sample: +5%'), date: raised, dir: 'up', method: 'pct', value: 5, adjustFixed: false, count: defs.length, isSample: true, createdById: userId },
    });
    const now: Record<string, { id: string; next: number }> = {};
    for (const [code, name, unit, supplyNet, consRate] of defs) {
      const p = await tx.ledgerProduct.create({
        data: { code, codeKey: code.toLowerCase(), name, unit, consRate, isActive: true, isSample: true, updatedById: userId },
      });
      const next = rnd(supplyNet * 1.05, cfg.roundUnit);
      now[code] = { id: p.id, next };
      await tx.ledgerPrice.createMany({
        data: [
          { productId: p.id, supplyNet, validFrom: first, note: L('firstNote', 'First price'), isSample: true, createdById: userId },
          { productId: p.id, supplyNet: next, validFrom: raised, changeId: change.id, note: change.title, isSample: true, createdById: userId },
        ],
      });
    }
    const hasRealStandard = (await tx.ledgerDistributor.count({ where: { isStandard: true, isSample: false } })) > 0;
    const std = await tx.ledgerDistributor.create({
      data: { name: L('distStd', 'Sample · standard distributor'), isStandard: !hasRealStandard, refRate: 3, note: L('sample', 'Sample'), isSample: true, updatedById: userId },
    });
    const other = await tx.ledgerDistributor.create({
      data: { name: L('distB', 'Sample distributor B'), isStandard: false, refRate: 2, note: L('sample', 'Sample'), isSample: true, updatedById: userId },
    });
    const line = (code: string, qty: number, discount: number, position: number) => ({
      productId: now[code].id,
      qty,
      amount: Math.round(now[code].next * qty * (1 - discount)),
      position,
    });
    const o1 = await tx.ledgerOrder.create({
      data: { orderNo: 'EX-4500001', date: toDate(`${month}-02`, 'date'), distributorId: std.id, basis: 'net', note: L('note1', ''), isSample: true, createdById: userId, updatedById: userId },
    });
    await tx.ledgerOrderLine.createMany({
      data: [line('EX-001', 500, 0.03, 0), line('EX-002', 300, 0.03, 1), line('EX-003', 20, 0.03, 2)].map(l => ({ ...l, orderId: o1.id })),
    });
    const o2 = await tx.ledgerOrder.create({
      data: { orderNo: 'EX-4500002', date: toDate(`${month}-04`, 'date'), distributorId: other.id, basis: 'net', note: L('note2', ''), isSample: true, createdById: userId, updatedById: userId },
    });
    await tx.ledgerOrderLine.createMany({
      data: [line('EX-001', 200, 0.015, 0), line('EX-003', 10, 0.03, 1)].map(l => ({ ...l, orderId: o2.id })),
    });
  });
  return { month };
}

/** Removes everything tagged as sample; a sample product or distributor a real order still uses stays. */
export async function clearSample() {
  return prisma.$transaction(async tx => {
    const orders = await tx.ledgerOrder.deleteMany({ where: { isSample: true } });
    await tx.ledgerPriceChange.deleteMany({ where: { isSample: true } });
    await tx.ledgerPrice.deleteMany({ where: { isSample: true } });
    const products = await tx.ledgerProduct.deleteMany({ where: { isSample: true, orderLines: { none: {} } } });
    const distributors = await tx.ledgerDistributor.deleteMany({ where: { isSample: true, orders: { none: {} } } });
    return { orders: orders.count, products: products.count, distributors: distributors.count };
  });
}

/* ───────────── link with the ordering system ───────────── */

/**
 * Brings the ordering system's catalog and companies into the ledger: a catalog product whose SKU is not a ledger code yet becomes
 * a ledger product (base price = its catalog price from today), a company that is no ledger distributor yet becomes one.
 * What already exists is only linked, never overwritten.
 */
export async function importCatalog(input: any, userId: string) {
  const unit = text(input?.unit, 40) || 'pack';
  const note = text(input?.note, 200) || 'Order system catalog';
  const today = toDate(todayTashkent(), 'date');
  const [catalog, companies, ledgerProducts, ledgerDistributors] = await Promise.all([
    prisma.product.findMany({ select: { id: true, sku: true, name: true, basePrice: true, isActive: true } }),
    prisma.company.findMany({ select: { id: true, name: true } }),
    prisma.ledgerProduct.findMany({ select: { id: true, codeKey: true, productId: true } }),
    prisma.ledgerDistributor.findMany({ select: { id: true, name: true, companyId: true } }),
  ]);
  const byCode = new Map(ledgerProducts.map(p => [p.codeKey, p]));
  const linkedCompanies = new Set(ledgerDistributors.map(d => d.companyId).filter(Boolean) as string[]);
  const byName = new Map(ledgerDistributors.map(d => [d.name.trim().toLowerCase(), d]));
  let products = 0;
  let distributors = 0;
  let linked = 0;
  await prisma.$transaction(async tx => {
    for (const c of catalog) {
      const codeKey = c.sku.trim().toLowerCase();
      if (!codeKey) continue;
      const have = byCode.get(codeKey);
      if (have) {
        if (!have.productId) {
          await tx.ledgerProduct.update({ where: { id: have.id }, data: { productId: c.id } });
          linked++;
        }
        continue;
      }
      const p = await tx.ledgerProduct.create({
        data: { code: c.sku.trim(), codeKey, name: c.name, unit, isActive: c.isActive, productId: c.id, updatedById: userId },
      });
      byCode.set(codeKey, { id: p.id, codeKey, productId: c.id });
      if (c.basePrice > 0) {
        await tx.ledgerPrice.create({ data: { productId: p.id, supplyNet: c.basePrice, validFrom: today, note, createdById: userId } });
      }
      products++;
    }
    for (const c of companies) {
      if (linkedCompanies.has(c.id)) continue;
      const same = byName.get(c.name.trim().toLowerCase());
      if (same) {
        if (!same.companyId) {
          await tx.ledgerDistributor.update({ where: { id: same.id }, data: { companyId: c.id } });
          linked++;
        }
        continue;
      }
      await tx.ledgerDistributor.create({ data: { name: c.name.trim(), companyId: c.id, updatedById: userId } });
      distributors++;
    }
  });
  return { products, distributors, linked };
}
