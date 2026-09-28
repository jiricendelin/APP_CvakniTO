import { notFound } from "next/navigation";
import { getCsrfToken } from "@/lib/auth/csrf";
import { getTenantId } from "@/lib/auth";
import { getReceiptForTenant } from "@/lib/receipts/repository";
import { canModifyReceipt } from "@/lib/receipts/eet-status";
import { ReceiptDetail } from "@/components/receipts/receipt-detail";

export const dynamic = "force-dynamic";

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tenantId, csrf] = await Promise.all([getTenantId(), getCsrfToken()]);
  const receipt = await getReceiptForTenant(tenantId, id);
  if (!receipt) notFound();

  return (
    <ReceiptDetail
      canModify={canModifyReceipt(receipt.eetStatus)}
      csrf={csrf}
      receipt={{
        id: receipt.id,
        number: receipt.number,
        variableSymbol: receipt.variableSymbol,
        paymentType: receipt.paymentType,
        totalCents: receipt.totalCents,
        eetStatus: receipt.eetStatus,
        printOnIssue: receipt.printOnIssue,
        createdAt: receipt.createdAt,
        items: receipt.items.map((item) => ({
          id: item.id,
          name: item.name,
          priceCents: item.priceCents,
          quantity: item.quantity,
          category: item.category,
          lineTotalCents: item.lineTotalCents,
        })),
      }}
    />
  );
}
