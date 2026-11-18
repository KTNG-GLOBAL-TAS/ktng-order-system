/**
 * Price & discount ledger — the price list as an Excel file.
 *
 * The page builds the rows in the language the person reads (its own dictionary) and sends them here; this module only lays
 * them out with exceljs, as the ordering system's other downloads do. Nothing is read from the database here.
 */
import ExcelJS from 'exceljs';
import { LedgerError } from './service';

type Cell = string | number | null;

interface SheetSpec {
  name: string;
  rows: Cell[][];
  /** Merged ranges as zero-based [startRow, startCol, endRow, endCol]. */
  merges?: number[][];
  /** Column widths in characters. */
  widths?: number[];
  /** Rows from `fromRow` on: numeric cells of columns `fromCol..toCol` are shown as whole numbers with thousands separators. */
  numbers?: { fromRow: number; fromCol: number; toCol: number };
  /** How many leading rows are the header (bold). */
  headerRows?: number;
}

const MAX_ROWS = 20000;
const MAX_COLS = 40;

function cell(value: unknown): Cell {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return isFinite(value) ? value : null;
  return String(value).slice(0, 500);
}

export async function buildWorkbook(input: any): Promise<Buffer> {
  const sheets: SheetSpec[] = Array.isArray(input?.sheets) ? input.sheets.slice(0, 5) : [];
  if (!sheets.length) throw new LedgerError('bad_export', 'Nothing to export.');
  const workbook = new ExcelJS.Workbook();
  const used = new Set<string>();
  for (const spec of sheets) {
    const rows = Array.isArray(spec?.rows) ? spec.rows : [];
    if (rows.length > MAX_ROWS) throw new LedgerError('bad_export', 'The export is too large.');
    let name = String(spec?.name || 'Sheet').replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31) || 'Sheet';
    while (used.has(name.toLowerCase())) name = `${name.slice(0, 28)} 2`;
    used.add(name.toLowerCase());
    const ws = workbook.addWorksheet(name);
    for (const row of rows) {
      ws.addRow((Array.isArray(row) ? row : []).slice(0, MAX_COLS).map(cell));
    }
    for (const m of spec?.merges || []) {
      if (Array.isArray(m) && m.length === 4 && m.every(n => Number.isInteger(n) && n >= 0 && n < MAX_ROWS)) {
        ws.mergeCells(m[0] + 1, m[1] + 1, m[2] + 1, m[3] + 1);
      }
    }
    (spec?.widths || []).slice(0, MAX_COLS).forEach((w, i) => {
      if (isFinite(Number(w))) ws.getColumn(i + 1).width = Math.min(Math.max(Number(w), 4), 80);
    });
    const header = Math.min(Number(spec?.headerRows) || 0, rows.length);
    for (let r = 1; r <= header; r++) {
      ws.getRow(r).font = { bold: true };
      ws.getRow(r).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    }
    const n = spec?.numbers;
    if (n && Number.isInteger(n.fromRow) && Number.isInteger(n.fromCol) && Number.isInteger(n.toCol)) {
      for (let r = n.fromRow + 1; r <= rows.length; r++) {
        for (let c = n.fromCol + 1; c <= Math.min(n.toCol + 1, MAX_COLS); c++) {
          const target = ws.getCell(r, c);
          if (typeof target.value === 'number') target.numFmt = '#,##0';
        }
      }
    }
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
