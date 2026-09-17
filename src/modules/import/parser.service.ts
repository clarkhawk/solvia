import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ImportColumnMapping, ImportRow } from "./types";
import { FIXED_TEMPLATE_COLUMNS } from "./types";

export const MAX_IMPORT_ROWS = 5_000;

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, "_");
}

function getValue(row: Record<string, string>, key: string | undefined, fallback?: string): string | undefined {
  if (!key) return fallback;
  const normalized = normalizeHeader(key);
  return row[normalized] ?? row[key] ?? fallback;
}

export class ImportParserService {
  parseCSV(content: string, mapping?: ImportColumnMapping): ImportRow[] {
    const parsed = Papa.parse<Record<string, string>>(content, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      throw new Error(`CSV parse error: ${parsed.errors[0].message}`);
    }

    if (parsed.data.length > MAX_IMPORT_ROWS) {
      throw new Error(`Import limit exceeded: maximum ${MAX_IMPORT_ROWS} rows`);
    }
    return this.mapRows(parsed.data, mapping);
  }

  parseExcel(buffer: ArrayBuffer, mapping?: ImportColumnMapping): ImportRow[] {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
    if (data.length > MAX_IMPORT_ROWS) {
      throw new Error(`Import limit exceeded: maximum ${MAX_IMPORT_ROWS} rows`);
    }
    return this.mapRows(data, mapping);
  }

  private mapRows(rawRows: Record<string, string>[], mapping?: ImportColumnMapping): ImportRow[] {
    const normalizedRows = rawRows.map((row) => {
      const normalized: Record<string, string> = {};
      for (const [k, v] of Object.entries(row)) {
        normalized[normalizeHeader(k)] = String(v ?? "").trim();
      }
      return normalized;
    });

    const col = (row: Record<string, string>, field: keyof ImportColumnMapping, fixedCol: string) =>
      getValue(row, mapping?.[field], fixedCol) ?? "";

    return normalizedRows
      .map((row) => {
        const amount = parseFloat(col(row, "invoiceAmount", "invoice_amount").replace(",", "."));
        const issuedAt = new Date(col(row, "invoiceIssuedAt", "invoice_issued_at"));
        const dueAt = new Date(col(row, "invoiceDueAt", "invoice_due_at"));

        return {
          clientName: col(row, "clientName", "client_name"),
          clientEmail: col(row, "clientEmail", "client_email") || undefined,
          clientPhone: col(row, "clientPhone", "client_phone") || undefined,
          externalCode: col(row, "externalCode", "external_code") || undefined,
          invoiceReference: col(row, "invoiceReference", "invoice_reference"),
          invoiceAmount: amount,
          invoiceIssuedAt: issuedAt,
          invoiceDueAt: dueAt,
        };
      })
      .filter((r) => r.clientName && r.invoiceReference && !isNaN(r.invoiceAmount));
  }

  getTemplateHeaders(): readonly string[] {
    return FIXED_TEMPLATE_COLUMNS;
  }
}

export const importParserService = new ImportParserService();
