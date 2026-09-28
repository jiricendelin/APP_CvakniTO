import { getCsrfToken } from "@/lib/auth/csrf";
import { getTenantId } from "@/lib/auth";
import { listCustomersForTenant } from "@/lib/customers/repository";
import { defaultInvoiceDueDateYmd } from "@/lib/invoices/default-due-date";
import { prisma } from "@/lib/prisma";
import { InvoiceCreateForm } from "@/components/invoices/invoice-create-form";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const [csrf, tenantId] = await Promise.all([getCsrfToken(), getTenantId()]);
  const [customers, catalog] = await Promise.all([
    listCustomersForTenant(tenantId),
    prisma.priceItem.findMany({
      where: { tenantId, active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        priceCents: true,
        category: true,
      },
    }),
  ]);

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Nová faktura</h1>
      <InvoiceCreateForm
        csrf={csrf}
        customers={customers.map((c) => ({ id: c.id, name: c.name }))}
        catalog={catalog}
        defaultDueDate={defaultInvoiceDueDateYmd()}
      />
    </div>
  );
}
