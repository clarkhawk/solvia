import { NextResponse } from "next/server";
import { alertEngineService } from "@/modules/alerts/engine.service";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await alertEngineService.runForAllOrganizations();
  return NextResponse.json(result);
}
