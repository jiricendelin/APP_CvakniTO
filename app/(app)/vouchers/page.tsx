import Link from "next/link";
import { getCsrfToken } from "@/lib/auth/csrf";
import { getTenantId } from "@/lib/auth";
import { listVouchersForTenant, listGiftEligiblePriceItems } from "@/lib/vouchers/repository";
import { listGiftCustomersForTenant } from "@/lib/gift-customers/repository";
import { isVoucherStatus } from "@/lib/vouchers/status";
import { VouchersList } from "@/components/vouchers/vouchers-list";
import { VoucherCreateForm } from "@/components/vouchers/voucher-create-form";
import { PageHeader } from "@/components/ui/page-header";
import { previewNextVoucherNumber } from "@/lib/vouchers/sequence";

export const dynamic = "force-dynamic";

export default async function VouchersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const statusFilter =
    sp.status && isVoucherStatus(sp.status) ? sp.status : undefined;

  const [csrf, tenantId] = await Promise.all([getCsrfToken(), getTenantId()]);
  const [vouchers, priceItems, giftCustomers, nextNumber] = await Promise.all([
    listVouchersForTenant(tenantId, statusFilter),
    listGiftEligiblePriceItems(tenantId),
    listGiftCustomersForTenant(tenantId),
    previewNextVoucherNumber(tenantId),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dárkové poukazy"
        description={`Další číslo: ${nextNumber}`}
      />

      <div className="flex flex-wrap gap-2 text-sm">
        <Link
          href="/vouchers"
          className={!statusFilter ? "font-semibold text-primary" : "text-muted-foreground"}
        >
          Vše
        </Link>
        {(
          ["vystaveny", "zaplaceny", "vycerpany", "propadly"] as const
        ).map((s) => (
          <Link
            key={s}
            href={`/vouchers?status=${s}`}
            className={
              statusFilter === s
                ? "font-semibold text-primary"
                : "text-muted-foreground"
            }
          >
            {s}
          </Link>
        ))}
      </div>

      <VoucherCreateForm
        csrf={csrf}
        priceItems={priceItems.map((p) => ({
          id: p.id,
          name: p.name,
          priceCents: p.priceCents,
        }))}
        giftCustomers={giftCustomers.map((c) => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
        }))}
      />

      <VouchersList
        rows={vouchers.map((v) => ({
          id: v.id,
          number: v.number,
          buyerName: v.buyerName,
          recipientName: v.recipientName,
          priceCents: v.priceCents,
          status: v.status,
          kind: v.kind,
          serviceName: v.serviceName,
          validUntil: v.validUntil.toISOString(),
          createdAt: v.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
