import { importParserService } from "@/modules/import/parser.service";
import { importMapperService } from "@/modules/import/mapper.service";
import type { ImportColumnMapping } from "@/modules/import/types";
import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonOk, withAuth } from "@/shared/api/handler";

export const GET = withAuth("import:execute", async () => {
  return jsonOk({ template: importParserService.getTemplateHeaders() });
});

export const POST = withAuth("import:execute", async (ctx, request) => {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const mappingRaw = formData.get("mapping") as string | null;

  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  const MAX_IMPORT_FILE_SIZE = 5 * 1024 * 1024;
  if (file.size === 0 || file.size > MAX_IMPORT_FILE_SIZE) {
    return NextResponse.json({ error: "File must be between 1 byte and 5 MB" }, { status: 400 });
  }

  const mappingSchema = z.object({
    clientName: z.string().max(100).optional(), clientEmail: z.string().max(100).optional(),
    clientPhone: z.string().max(100).optional(), externalCode: z.string().max(100).optional(),
    invoiceReference: z.string().max(100).optional(), invoiceAmount: z.string().max(100).optional(),
    invoiceIssuedAt: z.string().max(100).optional(), invoiceDueAt: z.string().max(100).optional(),
  }).strict();
  let mapping: ImportColumnMapping | undefined;
  if (mappingRaw) {
    try {
      mapping = mappingSchema.parse(JSON.parse(mappingRaw));
    } catch {
      return NextResponse.json({ error: "Invalid column mapping" }, { status: 400 });
    }
  }
  const buffer = await file.arrayBuffer();
  const filename = file.name.toLowerCase();

  let rows;
  try {
    if (filename.endsWith(".csv")) {
      rows = importParserService.parseCSV(new TextDecoder().decode(buffer), mapping);
    } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
      rows = importParserService.parseExcel(buffer, mapping);
    } else {
      return NextResponse.json({ error: "Unsupported file format. Use CSV or Excel." }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to parse file" },
      { status: 400 },
    );
  }

  const result = await importMapperService.importRows(ctx.organizationId, ctx.userId, rows);
  return jsonOk(result);
});
