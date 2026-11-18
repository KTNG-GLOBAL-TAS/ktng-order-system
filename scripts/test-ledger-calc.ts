/**
 * Unit tests of the price & discount ledger rules (src/lib/ledger/calc.ts) — no database.
 * Run: npx tsx scripts/test-ledger-calc.ts
 *
 * The numbers are the ledger manual's own cases: 12 % VAT, markups 10 % / 15 %, rounding to 100 UZS, tolerance 0.5 pp;
 * the sample data (three products, +5 % from 2026-09-01, two orders) is what «Explore with sample data» creates.
 */
import {
  DEFAULT_CONFIG,
  EvalContext,
  LedgerDistributorDoc,
  LedgerPriceDoc,
  LedgerProductDoc,
  changeCalc,
  derive,
  evalOrder,
  priceAt,
  rnd,
  vatOf,
} from '../src/lib/ledger/calc';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`[PASS] ${msg}`);
    passed++;
  } else {
    console.error(`[FAIL] ${msg}`);
    failed++;
  }
}

const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;

const cfg = { ...DEFAULT_CONFIG };

const product = (id: string, code: string, extra: Partial<LedgerProductDoc> = {}): LedgerProductDoc => ({
  id, code, name: code, unit: 'pack', distRate: null, consRate: null, distFixed: null, consFixed: null, active: true, ...extra,
});

const price = (id: string, productId: string, supplyNet: number, validFrom: string, createdAt = '2026-01-01T00:00:00.000Z', changeId: string | null = null): LedgerPriceDoc => ({
  id, productId, supplyNet, validFrom, changeId, note: '', createdAt,
});

function main() {
  console.log('=== PRICE & DISCOUNT LEDGER: CALCULATION RULES ===');

  // ---- rounding and VAT ----
  assert(rnd(16537.5, 100) === 16500 && rnd(16550, 100) === 16600, 'rounding to the unit (100 UZS), halves up');
  assert(rnd(1234.4, 0) === 1234, 'a rounding unit of 0 falls back to 1');
  assert(vatOf(15000, cfg) === 1800 && vatOf(16500, cfg) === 1980, 'VAT 12 % of the net price');

  // ---- the base price in force on a date ----
  const prices: LedgerPriceDoc[] = [
    price('p1', 'A', 15000, '2026-01-01'),
    price('p2', 'A', 15800, '2026-09-01', '2026-08-20T10:00:00.000Z', 'chg'),
    price('p3', 'A', 15750, '2026-09-01', '2026-08-25T10:00:00.000Z'), // the same day, entered later: wins
    price('p4', 'B', 18000, '2026-01-01'),
  ];
  assert(priceAt(prices, 'A', '2025-12-31') === null, 'no base price before the first effective date');
  assert(priceAt(prices, 'A', '2026-08-31')?.supplyNet === 15000, 'the old price stays in force until the new date');
  assert(priceAt(prices, 'A', '2026-09-01')?.id === 'p3', 'two prices from one date: the one entered later applies');
  assert(priceAt(prices, 'B', '2030-01-01')?.supplyNet === 18000, 'the last price applies to every later date');

  // ---- the two linked levels ----
  const d1 = derive(product('A', 'EX-001'), 15000, cfg);
  assert(d1.dist === 16500 && d1.cons === 19000 && d1.drDef && d1.crDef, 'default markups: 15 000 → 16 500 → 19 000 (18 975 rounded to 100)');
  const d2 = derive(product('C', 'EX-003', { consRate: 12 }), 150000, cfg);
  assert(d2.dist === 165000 && d2.cons === 184800 && !d2.crDef && d2.cr === 12, 'a product\'s own consumer markup replaces the default');
  const d3 = derive(product('F', 'FX', { distFixed: 17000 }), 15000, cfg);
  assert(d3.dist === 17000 && d3.distFixed && d3.cons === 19600, 'a fixed distributor price replaces the rate; the consumer price follows it (19 550 → 19 600)');
  const d4 = derive(product('G', 'FX2', { distFixed: 17000, consFixed: 21000 }), 15000, cfg);
  assert(d4.cons === 21000 && d4.consFixed, 'a fixed consumer price replaces the rate');

  // ---- orders: the sample data ----
  const products: Record<string, LedgerProductDoc> = {
    A: product('A', 'EX-001'),
    B: product('B', 'EX-002'),
    C: product('C', 'EX-003', { consRate: 12 }),
  };
  const samplePrices: LedgerPriceDoc[] = [
    price('a1', 'A', 15000, '2026-01-01'), price('a2', 'A', 15800, '2026-09-01', '2026-09-01T00:00:00.000Z', 'chg'),
    price('b1', 'B', 18000, '2026-01-01'), price('b2', 'B', 18900, '2026-09-01', '2026-09-01T00:00:00.000Z', 'chg'),
    price('c1', 'C', 150000, '2026-01-01'), price('c2', 'C', 157500, '2026-09-01', '2026-09-01T00:00:00.000Z', 'chg'),
  ];
  const distributors: Record<string, LedgerDistributorDoc> = {
    S: { id: 'S', name: 'Standard', isStandard: true, refRate: 3, note: '' },
    D: { id: 'D', name: 'Other', isStandard: false, refRate: 2, note: '' },
  };
  const ctx: EvalContext = { cfg, products, prices: samplePrices, distributors };
  const amount = (pid: string, qty: number, discount: number) => Math.round(priceAt(samplePrices, pid, '2026-11-02')!.supplyNet * qty * (1 - discount));

  const o1 = evalOrder({ orderNo: 'EX-4500001', date: '2026-11-02', distributorId: 'S', basis: 'net',
    lines: [{ productId: 'A', qty: 500, amount: amount('A', 500, 0.03) }, { productId: 'B', qty: 300, amount: amount('B', 300, 0.03) }, { productId: 'C', qty: 20, amount: amount('C', 20, 0.03) }] }, ctx);
  assert(o1.std === 15800 * 500 + 18900 * 300 + 157500 * 20, 'base amount = base price on the order date × quantity (the +5 % price applies from 2026-09-01)');
  assert(near(o1.rate, 0.03, 1e-6) && near(o1.disc, o1.std * 0.03, 1), 'a 3 % discount on every line is a 3 % discount of the order');
  assert(o1.status.length === 1 && o1.status[0][1] === 'st_ok', 'equal to the distributor\'s reference discount: no flag');
  assert(o1.actGross === o1.act + vatOf(o1.act, cfg) && o1.vat === vatOf(o1.act, cfg), 'amounts typed net: VAT and the total are added on top');

  const o2 = evalOrder({ orderNo: 'EX-4500002', date: '2026-11-04', distributorId: 'D', basis: 'net',
    lines: [{ productId: 'A', qty: 200, amount: amount('A', 200, 0.015) }, { productId: 'C', qty: 10, amount: amount('C', 10, 0.03) }] }, ctx);
  assert(o2.status.some(f => f[1] === 'st_dev') && o2.lines[1].flags.some(f => f[1] === 'st_dev') && o2.lines[0].flags[0][1] === 'st_ok',
    'lines discounted 1.5 % and 3 % (order ≈2.0 %): the 3 % line deviates by more than 0.5 pp and is flagged, the 1.5 % line (0.499 pp) is not');
  assert(!o2.status.some(f => f[1] === 'st_ref'), 'the order\'s discount (≈2.0 %) is not above the reference 2 % by more than the tolerance');

  const o3 = evalOrder({ orderNo: 'X', date: '2026-11-04', distributorId: 'D', basis: 'net',
    lines: [{ productId: 'A', qty: 100, amount: amount('A', 100, 0.04) }] }, ctx);
  assert(o3.status.some(f => f[1] === 'st_ref') && near(o3.refDiff as number, 2, 1e-6), 'a 4 % discount against a reference of 2 %: flagged, +2 pp');

  const gross = evalOrder({ orderNo: 'G', date: '2026-11-04', distributorId: 'S', basis: 'gross',
    lines: [{ productId: 'A', qty: 100, amount: 15800 * 100 * 1.12 }] }, ctx);
  assert(near(gross.act, 1580000, 1e-6) && near(gross.disc, 0, 1e-6) && near(gross.actGross, 1769600, 1e-6), 'amounts typed with VAT are brought to net before the comparison');

  const over = evalOrder({ orderNo: 'O', date: '2026-11-04', distributorId: 'S', basis: 'net', lines: [{ productId: 'A', qty: 10, amount: 160000 }] }, ctx);
  assert(over.lines[0].flags.some(f => f[1] === 'st_over') && over.status.some(f => f[1] === 'st_over_line'), 'a line sold above the base price is flagged');

  const early = evalOrder({ orderNo: 'E', date: '2025-06-01', distributorId: 'S', basis: 'net', lines: [{ productId: 'A', qty: 10, amount: 100000 }] }, ctx);
  assert(early.status[0][1] === 'st_missing' && early.std === 0, 'no base price on the order date: flagged, the line is left out of the totals');

  const old = evalOrder({ orderNo: 'H', date: '2026-08-15', distributorId: 'S', basis: 'net', lines: [{ productId: 'A', qty: 10, amount: 150000 }] }, ctx);
  assert(old.std === 150000 && near(old.disc, 0, 1e-6), 'an earlier order is checked against the price of its own date');

  // ---- bulk changes ----
  const targets = [products.A, products.B, products.C, product('N', 'NEW')];
  const base: LedgerPriceDoc[] = [price('a1', 'A', 15000, '2026-01-01'), price('b1', 'B', 18000, '2026-01-01'), price('c1', 'C', 150000, '2026-01-01')];
  const up = changeCalc({ date: '2026-09-01', dir: 'up', method: 'pct', value: 5, adjustFixed: false }, targets, base, cfg);
  assert(up[0].next === 15800 && up[1].next === 18900 && up[2].next === 157500, '+5 %: 15 750 → 15 800, 18 900, 157 500 (rounded to 100)');
  assert(up[3].skip === true && up[3].next === undefined, 'a product without a base price on that date is skipped');
  const down = changeCalc({ date: '2026-09-01', dir: 'down', method: 'amt', value: 500, adjustFixed: false }, targets.slice(0, 1), base, cfg);
  assert(down[0].next === 14500, 'a decrease by an amount per unit is taken as typed (no rounding)');
  const fixed = changeCalc({ date: '2026-09-01', dir: 'up', method: 'pct', value: 10, adjustFixed: true },
    [product('F', 'FX', { distFixed: 17000, consFixed: 21000 })], [price('f1', 'F', 15000, '2026-01-01')], cfg);
  assert(fixed[0].next === 16500 && fixed[0].distFixed === 18700 && fixed[0].consFixed === 23100 && fixed[0].fixedChanged === true,
    'fixed amounts move in the same proportion when asked (17 000 → 18 700, 21 000 → 23 100)');
  const kept = changeCalc({ date: '2026-09-01', dir: 'up', method: 'pct', value: 10, adjustFixed: false },
    [product('F', 'FX', { distFixed: 17000 })], [price('f1', 'F', 15000, '2026-01-01')], cfg);
  assert(kept[0].distFixed === 17000 && kept[0].fixedChanged === false, 'fixed amounts stay when the box is not ticked');

  console.log(`\n=== ${passed} passed, ${failed} failed ===`);
  if (failed) process.exit(1);
}

main();
