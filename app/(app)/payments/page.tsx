import { getTenantId } from "@/lib/auth";
import { listPaymentsForTenant } from "@/lib/payments/repository";
import { PaymentsList } from "@/components/payments/payments-list";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const tenantId = await getTenantId();
  const payments = await listPaymentsForTenant(tenantId);

  return (
    <PaymentsList
      payments={payments.map((p) => ({
        id: p.id,
        moveId: p.moveId,
        variableSymbol: p.variableSymbol,
        amountCents: p.amountCents,
        matched: p.matched,
        message: p.message,
        createdAt: p.createdAt,
        receiptId: p.receipt?.id ?? null,
        receiptNumber: p.receipt?.number ?? null,
        invoiceId: p.invoice?.id ?? null,
        invoiceNumber: p.invoice?.number ?? null,
      }))}
    />
  );
}
