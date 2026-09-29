import { getTenantId } from "@/lib/auth";
import { parseReceiptListFilters } from "@/lib/receipts/list-filters";
import { listReceiptsForTenant } from "@/lib/receipts/repository";
import { ReceiptsList } from "@/components/receipts/receipts-list";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tenantId = await getTenantId();
  const filters = parseReceiptListFilters(await searchParams);
  const receipts = await listReceiptsForTenant(tenantId, filters);

  return (
    <ReceiptsList
      filters={filters}
      receipts={receipts.map((r) => ({
        id: r.id,
        number: r.number,
        paymentType: r.paymentType,
        totalCents: r.totalCents,
        eetStatus: r.eetStatus,
        paidAt: r.paidAt,
        createdAt: r.createdAt,
      }))}
    />
  );
}
