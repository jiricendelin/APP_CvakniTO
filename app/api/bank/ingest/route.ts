import { NextResponse } from "next/server";
import { bankIngestPayloadSchema } from "@/lib/bank/ingest-schema";
import { processBankIngest } from "@/lib/bank/process-ingest";
import { env } from "@/lib/env";

export const runtime = "nodejs";

function authorize(request: Request): boolean {
  const expected = env.bankIngestToken;
  if (!expected) return false;
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] === expected;
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Neautorizováno." }, { status: 401 });
  }

  if (!env.bankIngestToken) {
    return NextResponse.json(
      { error: "BANK_INGEST_TOKEN není nastaven." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Neplatný JSON." }, { status: 400 });
  }

  const parsed = bankIngestPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Neplatný payload." },
      { status: 400 }
    );
  }

  try {
    const result = await processBankIngest(parsed.data);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Zpracování platby selhalo.",
      },
      { status: 500 }
    );
  }
}
