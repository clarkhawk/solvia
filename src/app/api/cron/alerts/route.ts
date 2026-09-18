import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { alertEngineService } from "@/modules/alerts/engine.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Comparaison à durée constante, insensible à la longueur des chaînes. */
function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET;

  // Sans secret configuré, la route reste fermée : sinon « Bearer undefined » suffirait à la déclencher.
  if (!expected) {
    console.error("[cron/alerts] CRON_SECRET absent : route désactivée.");
    return NextResponse.json({ error: "Cron non configuré." }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization") ?? "";
  if (!secretsMatch(authHeader, `Bearer ${expected}`)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const result = await alertEngineService.runForAllOrganizations();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron/alerts] échec du moteur d'alertes", error);
    return NextResponse.json({ error: "Échec du moteur d'alertes." }, { status: 500 });
  }
}
