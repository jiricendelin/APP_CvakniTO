import { notFound, redirect } from "next/navigation";
import { getCsrfToken } from "@/lib/auth/csrf";
import { getTenantId } from "@/lib/auth";
import { getReceiptForTenant } from "@/lib/receipts/repository";
import { canModifyReceipt } from "@/lib/receipts/eet-status";
import { isPaymentType } from "@/lib/receipts/payment-type";
import { listActivePriceItems } from "@/lib/pricelist/repository";
import { ReceiptEditForm } from "@/components/receipts/receipt-edit-form";

export const dynamic = "force-dynamic";

export default async function ReceiptEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [tenantId, csrf] = await Promise.all([getTenantId(), getCsrfToken()]);
  const [receipt, priceItems] = await Promise.all([
    getReceiptForTenant(tenantId, id),
    listActivePriceItems(tenantId),
  ]);
  if (!receipt) notFound();
  if (
    !canModifyReceipt({
      eetStatus: receipt.eetStatus,
      paidAt: receipt.paidAt,
      kind: receipt.kind,
    })
  ) {
    redirect(`/receipts/${id}`);
  }

  return (
    <ReceiptEditForm
      csrf={csrf}
      receiptId={receipt.id}
      number={receipt.number}
      paymentType={
        isPaymentType(receipt.paymentType) ? receipt.paymentType : "qr"
      }
      paidAt={receipt.paidAt}
      priceItems={priceItems.map((p) => ({
        id: p.id,
        name: p.name,
        priceCents: p.priceCents,
        category: p.category,
      }))}
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
