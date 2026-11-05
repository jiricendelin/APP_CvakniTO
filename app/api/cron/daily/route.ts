import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runDailyCron } from "@/lib/cron/daily";

export const dynamic = "force-dynamic";

function authorize(req: NextRequest): boolean {
  const secret = env.cronSecret;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const query = req.nextUrl.searchParams.get("token") ?? "";
  return bearer === secret || query === secret;
}

export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDailyCron();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron/daily]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Cron failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
