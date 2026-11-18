# Price & discount ledger (реестр цен и скидок)

A module of the ordering system for the team that keeps prices and checks SAP sales orders. It was first a stand-alone page on
claude.ai (manual «가격·할인 검증 대장 사용 설명서», 2026-11-05); since 2026-11-18 it lives here, with the system's own sign-in,
permissions, audit log and database. The page, its four languages (한국어 / English / Русский / Oʻzbekcha) and every calculation
are the original ones; only the storage changed.

## What it does

- **Three linked price levels in UZS**: base price (the standard distributor's supply price, a dated history) → distributor price
  (base × (1 + markup), or a fixed amount per product) → consumer price (distributor × (1 + markup), or fixed). VAT 12 % is shown
  beside every price (net / VAT / total).
- **Bulk increase / decrease** from an effective date (percent or an amount per unit, all products or selected ones, fixed amounts
  moved in proportion on request) — applied as one transaction and cancelled as a whole.
- **Check of SAP orders**: an order (number, date, distributor, lines «product · quantity · amount», typed net or with VAT, or
  pasted from SAP as `code TAB qty TAB amount`) is compared with the base price of its date: discount amount and rate per line and
  per order, by month and by distributor, with flags — no base price, line above the base price, allocation deviation above the
  tolerance, above the distributor's reference discount.
- **Price list on any date** with an Excel download.
- **Settings**: VAT rate, default markups, rounding unit, tolerance. **Sample data** to try it, removed in one action.
- **Import from the ordering system**: catalog products (SKU, name, pack price) and companies become ledger products and
  distributors; what is already in the ledger is only linked, never overwritten.

## Where it is

| What | Where |
|---|---|
| Page | `/ledger` — `src/app/ledger/route.ts` serves one HTML document; script and styles in `public/ledger-assets/` |
| API | `/api/ledger/*` — `src/app/api/ledger/[...path]/route.ts` |
| Rules (pure) | `src/lib/ledger/calc.ts` — the same formulas the page script uses |
| Database operations | `src/lib/ledger/service.ts`, Excel in `src/lib/ledger/export.ts` |
| Tables | `LedgerProduct`, `LedgerPrice`, `LedgerDistributor`, `LedgerPriceChange`, `LedgerOrder`, `LedgerOrderLine` (migration `20261118160000_add_price_ledger`, additive); settings in `SystemSetting`, key `ledger.config` |
| Tests | `npx tsx scripts/test-ledger-calc.ts` (27 checks, no database) |

The ledger keeps its own registry of products and distributors, linked to `Product` (by SKU) and `Company` when they exist. The
ordering engine does not read the ledger's tables and its prices are not changed by the ledger.

## Access

Two permissions in the role templates (group «Реестр цен и скидок»):

- `ledger:view` — read everything, download the price list;
- `ledger:edit` — enter and change orders, products, prices, price changes, distributors and settings.

The super administrator has both. By default «Менеджер продаж» gets `ledger:view`, «Бухгалтерия / Финансы» gets both (new
installations; existing role templates are edited in Admin → Roles). Every change is written to the audit log as `LEDGER_*`.

## Hosting on Railway

Two services in one Railway project, same region: this application and a `Postgres` service with a volume.

Service settings (set in the Railway dashboard — config files are not read for new services):

- pre-deploy command `npx prisma migrate deploy` (every deploy applies the pending migrations first);
- health check path `/api/auth/setup`, target port 8080;
- variables: `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`, `JWT_SECRET` and `BACKUP_ENCRYPTION_KEY` (generated in the dashboard,
  never written anywhere else). Google Drive, Supabase storage (product images) and Turnstile are optional and stay off until
  their keys are set.

When the repository is read by its public link (without the Railway GitHub App), a new commit is deployed with
Settings → Source → «Check for updates», not automatically.
