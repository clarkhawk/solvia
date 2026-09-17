export interface ImportColumnMapping {
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  externalCode?: string;
  invoiceReference?: string;
  invoiceAmount?: string;
  invoiceIssuedAt?: string;
  invoiceDueAt?: string;
}

export const FIXED_TEMPLATE_COLUMNS = [
  "client_name",
  "client_email",
  "client_phone",
  "external_code",
  "invoice_reference",
  "invoice_amount",
  "invoice_issued_at",
  "invoice_due_at",
] as const;

export interface ImportRow {
  /** Numéro de la ligne dans le fichier source, en-tête compris (première donnée = 2). */
  sourceRow: number;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  externalCode?: string;
  invoiceReference: string;
  invoiceAmount: number;
  invoiceIssuedAt: Date;
  invoiceDueAt: Date;
}

export interface ImportRowError {
  row: number;
  message: string;
}

/** Résultat de l'analyse d'un fichier : lignes valides d'un côté, lignes rejetées de l'autre. */
export interface ParsedImport {
  rows: ImportRow[];
  errors: ImportRowError[];
  /** En-têtes réellement trouvés dans le fichier, utiles pour diagnostiquer un mauvais format. */
  headers: string[];
}

export interface ImportResult {
  clientsCreated: number;
  clientsExisting: number;
  invoicesCreated: number;
  errors: ImportRowError[];
}
