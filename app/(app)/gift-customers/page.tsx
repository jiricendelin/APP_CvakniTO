import { getCsrfToken } from "@/lib/auth/csrf";
import { getTenantId } from "@/lib/auth";
import { listGiftCustomersForTenant } from "@/lib/gift-customers/repository";
import { GiftCustomersManager } from "@/components/gift-customers/gift-customers-manager";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";

export default async function GiftCustomersPage() {
  const [csrf, tenantId] = await Promise.all([getCsrfToken(), getTenantId()]);
  const customers = await listGiftCustomersForTenant(tenantId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zákazníci DP"
        description="Evidence zákazníků dárkových poukazů a stornopoplatků"
      />
      <GiftCustomersManager
        csrf={csrf}
        customers={customers.map((c) => ({
          id: c.id,
          lastName: c.lastName,
          firstName: c.firstName,
          phone: c.phone,
          email: c.email,
          note: c.note,
          awaitingStornoPayment: c.awaitingStornoPayment,
          stornoFeeCents: c.stornoFeeCents,
        }))}
      />
    </div>
  );
}
