import { NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth";
import { buildReportSummary } from "@/lib/reports/aggregate";
import { reportSummaryToCsv } from "@/lib/reports/csv";

export async function GET(request: Request) {
  const tenantId = await getTenantId();
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    params[k] = v;
  });

  const summary = await buildReportSummary(tenantId, params);
  const csv = reportSummaryToCsv(summary);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="prehled.csv"',
    },
  });
}
