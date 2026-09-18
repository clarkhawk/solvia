import { logAuditEvent } from "@/shared/audit/audit-log";
import { clientService } from "@/modules/clients/service";
import { invoiceService } from "@/modules/factures/service";
import { prisma } from "@/shared/db/prisma";
import type { ImportResult, ImportRow, ImportRowError } from "./types";

export class ImportMapperService {
  async importRows(
    organizationId: string,
    userId: string,
    rows: ImportRow[],
    parseErrors: ImportRowError[] = [],
  ): Promise<ImportResult> {
    const result: ImportResult = {
      clientsCreated: 0,
      clientsExisting: 0,
      invoicesCreated: 0,
      errors: [...parseErrors],
    };

    // Références déjà présentes en base : une seule requête au lieu d'une par ligne.
    const references = [...new Set(rows.map((r) => r.invoiceReference))];
    const existing = await prisma.invoice.findMany({
      where: { organizationId, reference: { in: references } },
      select: { reference: true },
    });
    const knownReferences = new Set(existing.map((i) => i.reference));

    // Un même client revient souvent sur plusieurs lignes. Sans code externe ni
    // e-mail, il serait recréé à chaque ligne : ce cache l'évite pour un import.
    const clientCache = new Map<string, string>();
    const cacheKey = (row: ImportRow) =>
      row.externalCode
        ? `code:${row.externalCode.toLowerCase()}`
        : row.clientEmail
          ? `mail:${row.clientEmail.toLowerCase()}`
          : `nom:${row.clientName.toLowerCase()}`;

    for (const row of rows) {
      const rowNumber = row.sourceRow;
      try {
        if (knownReferences.has(row.invoiceReference)) {
          result.errors.push({
            row: rowNumber,
            message: `Référence de facture déjà existante (${row.invoiceReference}) : ligne ignorée.`,
          });
          continue;
        }

        const key = cacheKey(row);
        let clientId = clientCache.get(key);

        if (clientId) {
          result.clientsExisting++;
        } else {
          const { client, created } = await clientService.findOrCreateByImport(organizationId, {
            externalCode: row.externalCode,
            identity: { name: row.clientName },
            contact: {
              email: row.clientEmail,
              phone: row.clientPhone,
            },
          });

          clientId = client.id;
          clientCache.set(key, client.id);
          if (created) result.clientsCreated++;
          else result.clientsExisting++;
        }

        await invoiceService.create(organizationId, userId, {
          clientId,
          reference: row.invoiceReference,
          amount: row.invoiceAmount,
          issuedAt: row.invoiceIssuedAt,
          dueAt: row.invoiceDueAt,
        });

        knownReferences.add(row.invoiceReference);
        result.invoicesCreated++;
      } catch (error) {
        result.errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : "Erreur inconnue",
        });
      }
    }

    result.errors.sort((a, b) => a.row - b.row);

    // Le journal d'audit ne doit jamais faire échouer un import déjà réalisé.
    try {
      await logAuditEvent({
        organizationId,
        userId,
        action: "import_complete",
        entityType: "Import",
        metadata: result as unknown as Record<string, unknown>,
      });
    } catch (error) {
      console.error("logAuditEvent(import_complete) a échoué", error);
    }

    return result;
  }
}

export const importMapperService = new ImportMapperService();
