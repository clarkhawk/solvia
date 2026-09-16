import { logAuditEvent } from "@/shared/audit/audit-log";
import { clientService } from "@/modules/clients/service";
import { invoiceService } from "@/modules/factures/service";
import type { ImportResult, ImportRow } from "./types";

export class ImportMapperService {
  async importRows(organizationId: string, userId: string, rows: ImportRow[]): Promise<ImportResult> {
    const result: ImportResult = {
      clientsCreated: 0,
      clientsExisting: 0,
      invoicesCreated: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const { client, created } = await clientService.findOrCreateByImport(organizationId, {
          externalCode: row.externalCode,
          identity: { name: row.clientName },
          contact: {
            email: row.clientEmail,
            phone: row.clientPhone,
          },
        });

        if (created) result.clientsCreated++;
        else result.clientsExisting++;

        await invoiceService.create(organizationId, userId, {
          clientId: client.id,
          reference: row.invoiceReference,
          amount: row.invoiceAmount,
          issuedAt: row.invoiceIssuedAt,
          dueAt: row.invoiceDueAt,
        });

        result.invoicesCreated++;
      } catch (error) {
        result.errors.push({
          row: i + 2,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    await logAuditEvent({
      organizationId,
      userId,
      action: "import_complete",
      entityType: "Import",
      metadata: result as unknown as Record<string, unknown>,
    });

    return result;
  }
}

export const importMapperService = new ImportMapperService();
