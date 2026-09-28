import { notFound } from "next/navigation";
import { getTenantId } from "@/lib/auth";
import { getInvoiceForTenant } from "@/lib/invoices/repository";
import { InvoiceDetail } from "@/components/invoices/invoice-detail";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const invoice = await getInvoiceForTenant(tenantId, id);
  if (!invoice) notFound();

  return (
    <InvoiceDetail
      invoice={{
        id: invoice.id,
        number: invoice.number,
        variableSymbol: invoice.variableSymbol,
        status: invoice.status,
        totalCents: invoice.totalCents,
        issuedAt: invoice.issuedAt,
        dueDate: invoice.dueDate,
        customer: {
          name: invoice.customer.name,
          ico: invoice.customer.ico,
          dic: invoice.customer.dic,
          address: invoice.customer.address,
          email: invoice.customer.email,
          phone: invoice.customer.phone,
        },
        items: invoice.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          priceCents: item.priceCents,
          lineTotalCents: item.lineTotalCents,
          category: item.category,
        })),
      }}
    />
  );
}
