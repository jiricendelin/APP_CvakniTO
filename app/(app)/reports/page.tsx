import { getTenantId } from "@/lib/auth";
import { buildReportSummary } from "@/lib/reports/aggregate";
import { ReportsView } from "@/components/reports/reports-view";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenantId = await getTenantId();
  const params = await searchParams;
  const summary = await buildReportSummary(tenantId, params);

  return <ReportsView summary={summary} />;
}
