import { importParserService } from "@/modules/import/parser.service";
import { importMapperService } from "@/modules/import/mapper.service";
import type { ImportColumnMapping, ParsedImport } from "@/modules/import/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonOk, withAuth } from "@/shared/api/handler";

// L'import lit la session et écrit en base : pas de mise en cache, exécution Node.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const GET = withAuth("import:execute", async () => {
  return jsonOk({ template: importParserService.getTemplateHeaders() });
});

export const POST = withAuth("import:execute", async (ctx, request) => {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const mappingRaw = formData.get("mapping") as string | null;

  if (!file) {
    return NextResponse.json({ error: "Aucun fichier reçu.", code: "FILE_REQUIRED" }, { status: 400 });
  }

  const MAX_IMPORT_FILE_SIZE = 4 * 1024 * 1024; // Vercel refuse les corps de requête au-delà de ~4,5 Mo.
  if (file.size === 0) {
    return NextResponse.json({ error: "Le fichier est vide.", code: "FILE_EMPTY" }, { status: 400 });
  }
  if (file.size > MAX_IMPORT_FILE_SIZE) {
    return NextResponse.json(
      { error: "Fichier trop volumineux : 4 Mo maximum. Découpez-le en plusieurs imports.", code: "FILE_TOO_LARGE" },
      { status: 413 },
    );
  }

  const mappingSchema = z
    .object({
      clientName: z.string().max(100).optional(),
      clientEmail: z.string().max(100).optional(),
      clientPhone: z.string().max(100).optional(),
      externalCode: z.string().max(100).optional(),
      invoiceReference: z.string().max(100).optional(),
      invoiceAmount: z.string().max(100).optional(),
      invoiceIssuedAt: z.string().max(100).optional(),
      invoiceDueAt: z.string().max(100).optional(),
    })
    .strict();

  let mapping: ImportColumnMapping | undefined;
  if (mappingRaw) {
    try {
      mapping = mappingSchema.parse(JSON.parse(mappingRaw));
    } catch {
      return NextResponse.json(
        { error: "Correspondance de colonnes invalide.", code: "INVALID_MAPPING" },
        { status: 400 },
      );
    }
  }

  const buffer = await file.arrayBuffer();
  const filename = file.name.toLowerCase();

  let parsed: ParsedImport;
  try {
    if (filename.endsWith(".csv") || filename.endsWith(".txt")) {
      parsed = importParserService.parseCSV(new TextDecoder("utf-8").decode(buffer), mapping);
    } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls") || filename.endsWith(".xlsm")) {
      parsed = importParserService.parseExcel(buffer, mapping);
    } else {
      return NextResponse.json(
        { error: "Format non pris en charge. Utilisez un fichier CSV ou Excel.", code: "UNSUPPORTED_FORMAT" },
        { status: 400 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Fichier illisible.",
        code: "PARSE_ERROR",
      },
      { status: 400 },
    );
  }

  // Aucune ligne exploitable : on renvoie les raisons plutôt qu'un résultat vide muet.
  if (parsed.rows.length === 0) {
    return NextResponse.json(
      {
        error:
          parsed.errors.length > 0
            ? "Aucune ligne exploitable : chaque ligne du fichier a été rejetée."
            : "Le fichier ne contient aucune ligne de données.",
        code: "NO_VALID_ROWS",
        errors: parsed.errors.slice(0, 50),
        headers: parsed.headers,
      },
      { status: 422 },
    );
  }

  const result = await importMapperService.importRows(
    ctx.organizationId,
    ctx.userId,
    parsed.rows,
    parsed.errors,
  );

  return jsonOk(result);
});
