import { importParserService } from "@/modules/import/parser.service";
import { importMapperService } from "@/modules/import/mapper.service";
import type { ImportColumnMapping } from "@/modules/import/types";
import { NextResponse } from "next/server";
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

  const mapping: ImportColumnMapping | undefined = mappingRaw ? JSON.parse(mappingRaw) : undefined;
  const buffer = await file.arrayBuffer();
  const filename = file.name.toLowerCase();

  let rows;
  if (filename.endsWith(".csv")) {
    rows = importParserService.parseCSV(new TextDecoder().decode(buffer), mapping);
  } else if (filename.endsWith(".xlsx") || filename.endsWith(".xls")) {
    rows = importParserService.parseExcel(buffer, mapping);
  } else {
    return NextResponse.json({ error: "Unsupported file format. Use CSV or Excel." }, { status: 400 });
  }

  const result = await importMapperService.importRows(ctx.organizationId, ctx.userId, rows);
  return jsonOk(result);
});
