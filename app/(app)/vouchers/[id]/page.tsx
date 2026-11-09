import { notFound } from "next/navigation";
import { getCsrfToken } from "@/lib/auth/csrf";
import { getTenantId } from "@/lib/auth";
import { getVoucherForTenant } from "@/lib/vouchers/repository";
import { listUnmatchedPaymentsForTenant } from "@/lib/payments/repository";
import { listGiftCustomersForTenant } from "@/lib/gift-customers/repository";
import { VoucherDetail } from "@/components/vouchers/voucher-detail";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function VoucherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [csrf, tenantId] = await Promise.all([getCsrfToken(), getTenantId()]);
  const [voucher, unmatchedRaw, giftCustomers] = await Promise.all([
    getVoucherForTenant(tenantId, id),
    listUnmatchedPaymentsForTenant(tenantId),
    listGiftCustomersForTenant(tenantId),
  ]);
  if (!voucher) notFound();

  const targetCents = voucher.priceCents;
  const unmatchedPayments = [...unmatchedRaw].sort((a, b) => {
    const aMatch = a.amountCents === targetCents ? 0 : 1;
    const bMatch = b.amountCents === targetCents ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <div className="space-y-6">
      <PageHeader title={`Poukaz ${voucher.number}`} />
      <VoucherDetail
        csrf={csrf}
        giftCustomers={giftCustomers.map((c) => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
        }))}
        unmatchedPayments={unmatchedPayments.map((p) => ({
          id: p.id,
          amountCents: p.amountCents,
          variableSymbol: p.variableSymbol,
          message: p.message,
          createdAt: p.createdAt.toISOString(),
        }))}
        voucher={{
          id: voucher.id,
          number: voucher.number,
          buyerName: voucher.buyerName,
          recipientName: voucher.recipientName,
          buyerEmail: voucher.buyerEmail,
          priceCents: voucher.priceCents,
          status: voucher.status,
          kind: voucher.kind,
          serviceName: voucher.serviceName,
          validUntil: voucher.validUntil.toISOString(),
          note: voucher.note,
          receipt: voucher.receipt
            ? {
                id: voucher.receipt.id,
                number: voucher.receipt.number,
                variableSymbol: voucher.receipt.variableSymbol,
                paidAt: voucher.receipt.paidAt?.toISOString() ?? null,
              }
            : null,
        }}
      />
    </div>
  );
}
