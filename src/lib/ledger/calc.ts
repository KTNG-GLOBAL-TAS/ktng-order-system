/**
 * Price & discount ledger — the calculation rules, pure functions (no database, no DOM).
 *
 * The same rules run in the browser (public/ledger/app.js renders with them) and on the server (bulk price
 * changes are computed here, never trusted from the client). scripts/test-ledger-calc.ts keeps both in step.
 *
 *   distributor price = base price × (1 + distributor markup)   — or the product's fixed amount
 *   consumer price    = distributor price × (1 + consumer markup) — or the product's fixed amount
 *   VAT               = net × rate, total = net + VAT
 *   discount          = base amount (base price on the order date × qty) − actual net amount
 */

export interface LedgerConfig {
  vatRate: number;   // %
  distRate: number;  // default distributor markup, %
  consRate: number;  // default consumer markup, %
  roundUnit: number; // UZS
  tol: number;       // tolerance, percentage points
}

export const DEFAULT_CONFIG: LedgerConfig = { vatRate: 12, distRate: 10, consRate: 15, roundUnit: 100, tol: 0.5 };

export interface LedgerProductDoc {
  id: string;
  code: string;
  name: string;
  unit: string;
  distRate: number | null;
  consRate: number | null;
  distFixed: number | null;
  consFixed: number | null;
  active: boolean;
  sample?: boolean;
}

export interface LedgerPriceDoc {
  id: string;
  productId: string;
  supplyNet: number;
  validFrom: string; // YYYY-MM-DD
  changeId: string | null;
  note: string;
  createdAt: string; // ISO
  createdBy?: string | null;
  sample?: boolean;
}

export interface LedgerDistributorDoc {
  id: string;
  name: string;
  isStandard: boolean;
  refRate: number | null;
  note: string;
  sample?: boolean;
}

export interface LedgerOrderLineDoc {
  productId: string;
  qty: number;
  amount: number;
}

export interface LedgerOrderDoc {
  id?: string;
  orderNo: string;
  date: string; // YYYY-MM-DD
  distributorId: string;
  basis: 'net' | 'gross';
  note?: string;
  lines: LedgerOrderLineDoc[];
}

export type Flag = ['ok' | 'warn' | 'bad', string];

export const isNum = (v: unknown): v is number => typeof v === 'number' && isFinite(v);

export const rnd = (v: number, unit: number): number => {
  const u = unit > 0 ? unit : 1;
  return Math.round(v / u) * u;
};

export const vatOf = (net: number, cfg: LedgerConfig): number => Math.round((net * cfg.vatRate) / 100);

/** The base price in force on `date`: the latest validFrom not after it; of two on one day — the one created later. */
export function priceAt(prices: LedgerPriceDoc[], productId: string, date: string): LedgerPriceDoc | null {
  let best: LedgerPriceDoc | null = null;
  for (const p of prices) {
    if (p.productId !== productId || !p.validFrom || p.validFrom > date) continue;
    if (!best || p.validFrom > best.validFrom || (p.validFrom === best.validFrom && (p.createdAt || '') > (best.createdAt || ''))) best = p;
  }
  return best;
}

export interface Derived {
  dist: number;
  cons: number;
  dr: number;
  cr: number;
  distFixed: boolean;
  consFixed: boolean;
  drDef: boolean;
  crDef: boolean;
}

/** The two linked price levels of a product for a base (supply) price. */
export function derive(
  prod: Pick<LedgerProductDoc, 'distRate' | 'consRate' | 'distFixed' | 'consFixed'>,
  supply: number,
  cfg: LedgerConfig
): Derived {
  const u = cfg.roundUnit;
  const dr = isNum(prod.distRate) ? prod.distRate : cfg.distRate;
  const cr = isNum(prod.consRate) ? prod.consRate : cfg.consRate;
  const dist = isNum(prod.distFixed) ? prod.distFixed : rnd(supply * (1 + dr / 100), u);
  const cons = isNum(prod.consFixed) ? prod.consFixed : rnd(dist * (1 + cr / 100), u);
  return { dist, cons, dr, cr, distFixed: isNum(prod.distFixed), consFixed: isNum(prod.consFixed), drDef: !isNum(prod.distRate), crDef: !isNum(prod.consRate) };
}

export interface EvalLine extends LedgerOrderLineDoc {
  prod: LedgerProductDoc | undefined;
  pr: LedgerPriceDoc | null;
  act: number;
  std: number;
  disc: number;
  rate: number;
  unit: number;
  flags: Flag[];
}

export interface EvalResult {
  lines: EvalLine[];
  std: number;
  act: number;
  disc: number;
  rate: number;
  refDiff: number | null;
  status: Flag[];
  actGross: number;
  vat: number;
}

export interface EvalContext {
  cfg: LedgerConfig;
  products: Record<string, LedgerProductDoc>;
  prices: LedgerPriceDoc[];
  distributors: Record<string, LedgerDistributorDoc>;
}

const sumBy = <T,>(rows: T[], pick: (row: T) => number): number => rows.reduce((s, x) => s + (isFinite(pick(x)) ? pick(x) : 0), 0);

/** One SAP order against the base prices of its date: the discount per line and in total, and the flags. */
export function evalOrder(o: LedgerOrderDoc, ctx: EvalContext): EvalResult {
  const { cfg } = ctx;
  const vr = cfg.vatRate / 100;
  const lines: EvalLine[] = (o.lines || []).map(l => {
    const prod = ctx.products[l.productId];
    const pr = l.productId ? priceAt(ctx.prices, l.productId, o.date || '') : null;
    const qty = Number(l.qty) || 0;
    const amt = Number(l.amount);
    const act = isFinite(amt) ? (o.basis === 'gross' ? amt / (1 + vr) : amt) : NaN;
    const std = pr ? pr.supplyNet * qty : NaN;
    const disc = std - act;
    const rate = std > 0 ? disc / std : NaN;
    return { ...l, prod, pr, qty, act, std, disc, rate, unit: qty ? act / qty : NaN, flags: [] };
  });
  const ok = lines.filter(l => l.pr && isFinite(l.act));
  const std = sumBy(ok, l => l.std);
  const act = sumBy(ok, l => l.act);
  const disc = std - act;
  const rate = std > 0 ? disc / std : NaN;
  let missing = false;
  let over = false;
  let dev = false;
  for (const l of lines) {
    if (!l.pr) {
      l.flags.push(['bad', 'st_missing']);
      missing = true;
      continue;
    }
    if (l.disc < -0.5) {
      l.flags.push(['bad', 'st_over']);
      over = true;
    }
    if (isFinite(rate) && isFinite(l.rate) && Math.abs(l.rate - rate) * 100 > cfg.tol) {
      l.flags.push(['warn', 'st_dev']);
      dev = true;
    }
    if (!l.flags.length) l.flags.push(['ok', 'st_ok']);
  }
  const d = ctx.distributors[o.distributorId];
  const refDiff = d && isNum(d.refRate) && isFinite(rate) ? rate * 100 - d.refRate : null;
  const status: Flag[] = [];
  if (missing) status.push(['bad', 'st_missing']);
  if (over) status.push(['bad', 'st_over_line']);
  if (dev) status.push(['warn', 'st_dev']);
  if (refDiff != null && refDiff > cfg.tol) status.push(['warn', 'st_ref']);
  if (!status.length) status.push(['ok', 'st_ok']);
  const actGross = o.basis === 'gross' ? sumBy(ok, l => Number(l.amount)) : act + vatOf(act, cfg);
  return { lines, std, act, disc, rate, refDiff, status, actGross, vat: actGross - act };
}

export interface ChangeForm {
  date: string; // YYYY-MM-DD
  dir: 'up' | 'down';
  method: 'pct' | 'amt';
  value: number;
  adjustFixed: boolean;
}

export interface ChangeRow {
  product: LedgerProductDoc;
  /** No base price in force on the change's date: the product is left out. */
  skip: boolean;
  base?: number;
  next?: number;
  distFixed?: number | null;
  consFixed?: number | null;
  fixedChanged?: boolean;
}

/** A bulk increase / decrease from a date: the new base price of every target, and its fixed amounts moved in the same proportion. */
export function changeCalc(form: ChangeForm, targets: LedgerProductDoc[], prices: LedgerPriceDoc[], cfg: LedgerConfig): ChangeRow[] {
  const u = cfg.roundUnit;
  const sign = form.dir === 'down' ? -1 : 1;
  return targets.map(product => {
    const cur = form.date ? priceAt(prices, product.id, form.date) : null;
    if (!cur || !isFinite(form.value)) return { product, skip: !cur };
    const base = cur.supplyNet;
    const next = form.method === 'pct' ? rnd(base * (1 + (sign * form.value) / 100), u) : base + sign * form.value;
    const ratio = base ? next / base : 1;
    let distFixed = product.distFixed;
    let consFixed = product.consFixed;
    if (form.adjustFixed) {
      if (isNum(product.distFixed)) distFixed = rnd(product.distFixed * ratio, u);
      if (isNum(product.consFixed)) consFixed = rnd(product.consFixed * ratio, u);
    }
    return { product, skip: false, base, next, distFixed, consFixed, fixedChanged: distFixed !== product.distFixed || consFixed !== product.consFixed };
  });
}
