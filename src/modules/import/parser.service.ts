import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ImportColumnMapping, ImportRow, ImportRowError, ParsedImport } from "./types";
import { FIXED_TEMPLATE_COLUMNS } from "./types";

export const MAX_IMPORT_ROWS = 5_000;

/** Normalise un en-tête : accents retirés, minuscules, séparateurs en underscore. */
function normalizeHeader(h: string): string {
  return h
    .replace(/^﻿/, "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getValue(
  row: Record<string, unknown>,
  key: string | undefined,
  fallback: string,
): unknown {
  if (key) {
    const normalized = normalizeHeader(key);
    if (row[normalized] !== undefined) return row[normalized];
    if (row[key] !== undefined) return row[key];
  }
  return row[fallback];
}

function toText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

/**
 * Lit un montant écrit à la française ou à l'anglaise.
 * Accepte « 1 250,50 », « 1.250,50 », « 1,250.50 », « 4500 », « 4 500,00 € ».
 * Retourne null si la valeur n'est pas un nombre exploitable.
 */
export function parseAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  let raw = toText(value);
  if (!raw) return null;

  // Espaces (y compris insécables), symboles monétaires et lettres parasites.
  raw = raw.replace(/[\s  ]/g, "").replace(/[€$£]/g, "");
  if (!raw) return null;

  const lastComma = raw.lastIndexOf(",");
  const lastDot = raw.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    // Le séparateur décimal est le dernier des deux ; l'autre sépare les milliers.
    if (lastComma > lastDot) raw = raw.replace(/\./g, "").replace(",", ".");
    else raw = raw.replace(/,/g, "");
  } else if (lastComma !== -1) {
    const decimals = raw.length - lastComma - 1;
    // « 1,250 » = millier ; « 1,25 » = décimal.
    raw = decimals === 3 ? raw.replace(/,/g, "") : raw.replace(",", ".");
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Date de référence du format série Excel (système 1900, décalage inclus). */
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);

/**
 * Lit une date au format ISO (2026-03-15), français (15/03/2026), pointé
 * (15.03.2026), un objet Date, ou un numéro de série Excel.
 * La date est fixée à midi UTC pour qu'aucun fuseau ne la décale d'un jour.
 */
export function parseImportDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 12));
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (value <= 0 || value > 60_000) return null;
    const ms = EXCEL_EPOCH_UTC + Math.round(value) * 86_400_000;
    const d = new Date(ms);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12));
  }

  const raw = toText(value);
  if (!raw) return null;

  const build = (y: number, m: number, d: number): Date | null => {
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    const date = new Date(Date.UTC(y, m - 1, d, 12));
    if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
      return null;
    }
    return date;
  };

  // 2026-03-15 ou 2026/03/15 (éventuellement suivi d'une heure)
  const iso = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s].*)?$/);
  if (iso) return build(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  // 15/03/2026, 15-03-2026, 15.03.2026 — jour en premier (usage francophone)
  const eu = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (eu) return build(Number(eu[3]), Number(eu[2]), Number(eu[1]));

  // Série Excel transmise sous forme de texte
  if (/^\d{4,5}$/.test(raw)) return parseImportDate(Number(raw));

  return null;
}

export class ImportParserService {
  parseCSV(content: string, mapping?: ImportColumnMapping): ParsedImport {
    const parsed = Papa.parse<Record<string, unknown>>(content, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => normalizeHeader(h),
    });

    // Papaparse signale aussi des anomalies non bloquantes : on ne retient que le fatal.
    const fatal = parsed.errors.find((e) => e.type === "Delimiter" || e.code === "UndetectableDelimiter");
    if (fatal) {
      throw new Error(`Fichier CSV illisible : ${fatal.message}`);
    }

    if (parsed.data.length > MAX_IMPORT_ROWS) {
      throw new Error(`Limite dépassée : ${MAX_IMPORT_ROWS} lignes maximum par import.`);
    }

    return this.mapRows(parsed.data, mapping, parsed.meta.fields ?? []);
  }

  parseExcel(buffer: ArrayBuffer, mapping?: ImportColumnMapping): ParsedImport {
    // XLSX.read attend un Uint8Array pour le type "array", pas un ArrayBuffer brut.
    const workbook = XLSX.read(new Uint8Array(buffer), { type: "array", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error("Le fichier Excel ne contient aucune feuille.");
    }

    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: true });
    if (rawRows.length > MAX_IMPORT_ROWS) {
      throw new Error(`Limite dépassée : ${MAX_IMPORT_ROWS} lignes maximum par import.`);
    }

    const headers = Object.keys(rawRows[0] ?? {}).map(normalizeHeader);
    const normalized = rawRows.map((row) => {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(row)) out[normalizeHeader(k)] = v;
      return out;
    });

    return this.mapRows(normalized, mapping, headers);
  }

  private mapRows(
    rawRows: Record<string, unknown>[],
    mapping: ImportColumnMapping | undefined,
    headers: string[],
  ): ParsedImport {
    const normalizedHeaders = headers.map(normalizeHeader).filter(Boolean);

    // Aucune colonne reconnue : inutile de parcourir le fichier ligne par ligne.
    const mappedHeaders = Object.values(mapping ?? {}).map((h) => normalizeHeader(String(h)));
    const expected = new Set<string>([...FIXED_TEMPLATE_COLUMNS, ...mappedHeaders]);
    const matched = normalizedHeaders.filter((h) => expected.has(h));
    if (normalizedHeaders.length > 0 && matched.length === 0) {
      throw new Error(
        `Colonnes non reconnues. Attendu : ${FIXED_TEMPLATE_COLUMNS.join(", ")}. Trouvé : ${normalizedHeaders.join(", ")}.`,
      );
    }

    const rows: ImportRow[] = [];
    const errors: ImportRowError[] = [];

    rawRows.forEach((raw, index) => {
      const sourceRow = index + 2; // + en-tête, + index base 1
      const row: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(raw)) row[normalizeHeader(k)] = v;

      const cell = (field: keyof ImportColumnMapping, fixedCol: string) =>
        getValue(row, mapping?.[field], fixedCol);

      const clientName = toText(cell("clientName", "client_name"));
      const invoiceReference = toText(cell("invoiceReference", "invoice_reference"));
      const rawAmount = cell("invoiceAmount", "invoice_amount");
      const rawIssuedAt = cell("invoiceIssuedAt", "invoice_issued_at");
      const rawDueAt = cell("invoiceDueAt", "invoice_due_at");

      // Ligne entièrement vide : ignorée sans message.
      const isEmpty =
        !clientName && !invoiceReference && !toText(rawAmount) && !toText(rawIssuedAt) && !toText(rawDueAt);
      if (isEmpty) return;

      const problems: string[] = [];
      if (!clientName) problems.push("client_name manquant");
      if (!invoiceReference) problems.push("invoice_reference manquant");

      const amount = parseAmount(rawAmount);
      if (amount === null) problems.push(`invoice_amount illisible (« ${toText(rawAmount)} »)`);
      else if (amount <= 0) problems.push("invoice_amount doit être supérieur à zéro");

      const issuedAt = parseImportDate(rawIssuedAt);
      if (!issuedAt) problems.push(`invoice_issued_at illisible (« ${toText(rawIssuedAt)} »)`);

      const dueAt = parseImportDate(rawDueAt);
      if (!dueAt) problems.push(`invoice_due_at illisible (« ${toText(rawDueAt)} »)`);

      if (issuedAt && dueAt && dueAt.getTime() < issuedAt.getTime()) {
        problems.push("invoice_due_at est antérieure à invoice_issued_at");
      }

      if (problems.length > 0) {
        errors.push({ row: sourceRow, message: problems.join(" ; ") });
        return;
      }

      rows.push({
        sourceRow,
        clientName,
        clientEmail: toText(cell("clientEmail", "client_email")) || undefined,
        clientPhone: toText(cell("clientPhone", "client_phone")) || undefined,
        externalCode: toText(cell("externalCode", "external_code")) || undefined,
        invoiceReference,
        invoiceAmount: amount as number,
        invoiceIssuedAt: issuedAt as Date,
        invoiceDueAt: dueAt as Date,
      });
    });

    return { rows, errors, headers: normalizedHeaders };
  }

  getTemplateHeaders(): readonly string[] {
    return FIXED_TEMPLATE_COLUMNS;
  }
}

export const importParserService = new ImportParserService();
