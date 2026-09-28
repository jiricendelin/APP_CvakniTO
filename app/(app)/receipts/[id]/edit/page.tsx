import { notFound, redirect } from "next/navigation";
import { getCsrfToken } from "@/lib/auth/csrf";
import { getTenantId } from "@/lib/auth";
import { getReceiptForTenant } from "@/lib/receipts/repository";
import { canModifyReceipt } from "@/lib/receipts/eet-status";
import { ReceiptEditForm } from "@/components/receipts/receipt-edit-form";

export const dynamic = "force-dynamic";

export default async function ReceiptEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tenantId, csrf] = await Promise.all([getTenantId(), getCsrfToken()]);
  const receipt = await getReceiptForTenant(tenantId, id);
  if (!receipt) notFound();
  if (!canModifyReceipt(receipt.eetStatus)) {
    redirect(`/receipts/${id}`);
  }

  return (
    <ReceiptEditForm
      csrf={csrf}
      receiptId={receipt.id}
      number={receipt.number}
      items={receipt.items.map((item) => ({
        id: item.id,
        name: item.name,
        priceCents: item.priceCents,
        quantity: item.quantity,
        category: item.category,
      }))}
    />
  );
}
