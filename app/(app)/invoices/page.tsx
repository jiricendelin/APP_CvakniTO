import { getTenantId } from "@/lib/auth";
import { listInvoicesForTenant } from "@/lib/invoices/repository";
import { InvoicesList } from "@/components/invoices/invoices-list";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const tenantId = await getTenantId();
  const invoices = await listInvoicesForTenant(tenantId);

  return (
    <InvoicesList
      invoices={invoices.map((inv) => ({
        id: inv.id,
        number: inv.number,
        totalCents: inv.totalCents,
        status: inv.status,
        dueDate: inv.dueDate,
        issuedAt: inv.issuedAt,
        customerName: inv.customer.name,
      }))}
    />
  );
}
