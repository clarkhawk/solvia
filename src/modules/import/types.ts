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
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  externalCode?: string;
  invoiceReference: string;
  invoiceAmount: number;
  invoiceIssuedAt: Date;
  invoiceDueAt: Date;
}

export interface ImportResult {
  clientsCreated: number;
  clientsExisting: number;
  invoicesCreated: number;
  errors: Array<{ row: number; message: string }>;
}
