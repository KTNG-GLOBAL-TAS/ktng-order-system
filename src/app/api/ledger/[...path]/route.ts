import { NextRequest, NextResponse } from 'next/server';
import { requirePermissionAsync, SessionExpiredError, hasPermission } from '@/lib/auth';
import { AuditService } from '@/lib/audit/audit.service';
import * as ledger from '@/lib/ledger/service';
import { buildWorkbook } from '@/lib/ledger/export';

export const dynamic = 'force-dynamic';

/**
 * Price & discount ledger API (the page /ledger talks to it).
 *
 *   GET    /api/ledger/state                  everything the page shows + who is looking      ledger:view | ledger:edit
 *   PUT    /api/ledger/config                 calculation settings                            ledger:edit
 *   POST   /api/ledger/products               new product with its first base price
 *   PUT    /api/ledger/products/:id           edit · DELETE removes (never one used in orders)
 *   POST   /api/ledger/prices                 a new base price from a date · DELETE /prices/:id
 *   POST   /api/ledger/distributors           · PUT /distributors/:id · DELETE /distributors/:id
 *   POST   /api/ledger/orders                 a SAP order · PUT /orders/:id · DELETE /orders/:id
 *   POST   /api/ledger/changes                bulk increase / decrease · DELETE /changes/:id cancels it as a whole
 *   POST   /api/ledger/sample                 sample data · DELETE /sample removes it
 *   POST   /api/ledger/import                 products and companies of the ordering system → the ledger
 *   POST   /api/ledger/export                 the price list as an Excel file (rows come from the page)   ledger:view | ledger:edit
 */

const VIEW = ['ledger:view', 'ledger:edit'];
const EDIT = 'ledger:edit';

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

function failure(err: any) {
  if (err instanceof SessionExpiredError || err?.code === 'SESSION_EXPIRED_ANOTHER_DEVICE') {
    return NextResponse.json({ error: err.message, code: 'SESSION_EXPIRED_ANOTHER_DEVICE' }, { status: 401 });
  }
  if (err instanceof ledger.LedgerError) {
    return NextResponse.json({ error: err.message, code: err.code, params: err.params }, { status: err.status });
  }
  const message = String(err?.message || '');
  if (message.includes('недостаточно прав')) return NextResponse.json({ error: message, code: 'forbidden' }, { status: 403 });
  if (message.includes('авторизация')) return NextResponse.json({ error: message, code: 'unauthenticated' }, { status: 401 });
  console.error('[ledger] request failed:', err);
  return NextResponse.json({ error: 'The request could not be completed.', code: 'error' }, { status: 500 });
}

async function body(req: NextRequest): Promise<any> {
  try {
    return await req.json();
  } catch {
    throw new ledger.LedgerError('bad_json', 'A JSON body is required.');
  }
}

async function audit(req: NextRequest, userId: string, action: string, details: Record<string, unknown>) {
  await AuditService.log({ userId, action: `LEDGER_${action}`, details: JSON.stringify(details).slice(0, 900), req });
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermissionAsync(req, VIEW);
    const { path } = await context.params;
    if (path.join('/') !== 'state') return NextResponse.json({ error: 'Not found', code: 'not_found' }, { status: 404 });
    const state = await ledger.getState();
    return NextResponse.json({
      ...state,
      me: {
        id: session.userId,
        name: session.name,
        canWrite: hasPermission(session, EDIT),
        dashboard: session.defaultDashboard || '/',
      },
    });
  } catch (err) {
    return failure(err);
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { path } = await context.params;
    if (path.join('/') === 'export') {
      // the price list a viewer may read, as a file: built from the rows the page shows (no database read)
      await requirePermissionAsync(req, VIEW);
      const file = await buildWorkbook(await body(req));
      return new NextResponse(file as any, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="price-list.xlsx"',
          'Cache-Control': 'no-store',
        },
      });
    }
    const session = await requirePermissionAsync(req, EDIT);
    const uid = session.userId;
    const input = await body(req);
    switch (path.join('/')) {
      case 'products': {
        const r = await ledger.createProduct(input, uid);
        await audit(req, uid, 'PRODUCT_CREATE', { id: r.id, code: input?.code });
        return NextResponse.json(r);
      }
      case 'prices': {
        const r = await ledger.createPrice(input, uid);
        await audit(req, uid, 'PRICE_SET', { id: r.id, productId: input?.productId, supplyNet: input?.supplyNet, validFrom: input?.validFrom });
        return NextResponse.json(r);
      }
      case 'distributors': {
        const r = await ledger.saveDistributor(null, input, uid);
        await audit(req, uid, 'DISTRIBUTOR_CREATE', { id: r.id, name: input?.name });
        return NextResponse.json(r);
      }
      case 'orders': {
        const r = await ledger.saveOrder(null, input, uid);
        await audit(req, uid, 'ORDER_CREATE', { id: r.id, orderNo: input?.orderNo, date: input?.date, lines: input?.lines?.length });
        return NextResponse.json(r);
      }
      case 'changes': {
        const r = await ledger.applyChange(input, uid);
        await audit(req, uid, 'PRICE_CHANGE_APPLY', { id: r.id, title: input?.title, date: input?.date, dir: input?.dir, method: input?.method, value: input?.value, count: r.count });
        return NextResponse.json(r);
      }
      case 'sample': {
        const r = await ledger.loadSample(input, uid);
        await audit(req, uid, 'SAMPLE_LOAD', r);
        return NextResponse.json(r);
      }
      case 'import': {
        const r = await ledger.importCatalog(input, uid);
        await audit(req, uid, 'IMPORT_CATALOG', r);
        return NextResponse.json(r);
      }
      default:
        return NextResponse.json({ error: 'Not found', code: 'not_found' }, { status: 404 });
    }
  } catch (err) {
    return failure(err);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermissionAsync(req, EDIT);
    const { path } = await context.params;
    const uid = session.userId;
    const input = await body(req);
    const [kind, id] = path;
    if (kind === 'config' && path.length === 1) {
      const cfg = await ledger.saveConfig(input);
      await audit(req, uid, 'CONFIG_SAVE', { ...cfg });
      return NextResponse.json(cfg);
    }
    if (path.length !== 2 || !id) return NextResponse.json({ error: 'Not found', code: 'not_found' }, { status: 404 });
    switch (kind) {
      case 'products': {
        const r = await ledger.updateProduct(id, input, uid);
        await audit(req, uid, 'PRODUCT_UPDATE', { id, code: input?.code });
        return NextResponse.json(r);
      }
      case 'distributors': {
        const r = await ledger.saveDistributor(id, input, uid);
        await audit(req, uid, 'DISTRIBUTOR_UPDATE', { id, name: input?.name });
        return NextResponse.json(r);
      }
      case 'orders': {
        const r = await ledger.saveOrder(id, input, uid);
        await audit(req, uid, 'ORDER_UPDATE', { id, orderNo: input?.orderNo, date: input?.date, lines: input?.lines?.length });
        return NextResponse.json(r);
      }
      default:
        return NextResponse.json({ error: 'Not found', code: 'not_found' }, { status: 404 });
    }
  } catch (err) {
    return failure(err);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await requirePermissionAsync(req, EDIT);
    const { path } = await context.params;
    const uid = session.userId;
    const [kind, id] = path;
    if (kind === 'sample' && path.length === 1) {
      const r = await ledger.clearSample();
      await audit(req, uid, 'SAMPLE_CLEAR', r);
      return NextResponse.json(r);
    }
    if (path.length !== 2 || !id) return NextResponse.json({ error: 'Not found', code: 'not_found' }, { status: 404 });
    switch (kind) {
      case 'products': {
        const r = await ledger.deleteProduct(id);
        await audit(req, uid, 'PRODUCT_DELETE', { id });
        return NextResponse.json(r);
      }
      case 'prices': {
        const r = await ledger.deletePrice(id);
        await audit(req, uid, 'PRICE_DELETE', r);
        return NextResponse.json(r);
      }
      case 'distributors': {
        const r = await ledger.deleteDistributor(id);
        await audit(req, uid, 'DISTRIBUTOR_DELETE', { id });
        return NextResponse.json(r);
      }
      case 'orders': {
        const r = await ledger.deleteOrder(id);
        await audit(req, uid, 'ORDER_DELETE', { id });
        return NextResponse.json(r);
      }
      case 'changes': {
        const r = await ledger.cancelChange(id, uid);
        await audit(req, uid, 'PRICE_CHANGE_CANCEL', { id });
        return NextResponse.json(r);
      }
      default:
        return NextResponse.json({ error: 'Not found', code: 'not_found' }, { status: 404 });
    }
  } catch (err) {
    return failure(err);
  }
}
