import { getTenantId } from "@/lib/auth";
import { getCsrfToken } from "@/lib/auth/csrf";
import { listPaymentsForTenant } from "@/lib/payments/repository";
import { PaymentsList } from "@/components/payments/payments-list";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const [tenantId, csrf] = await Promise.all([getTenantId(), getCsrfToken()]);
  const payments = await listPaymentsForTenant(tenantId);

  return (
    <PaymentsList
      csrf={csrf}
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
        receiptUnpaid: p.receipt ? p.receipt.paidAt === null : false,
        invoiceId: p.invoice?.id ?? null,
        invoiceNumber: p.invoice?.number ?? null,
      }))}
    />
  );
}
