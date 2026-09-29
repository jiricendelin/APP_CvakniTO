import { notFound } from "next/navigation";
import { getCsrfToken } from "@/lib/auth/csrf";
import { getTenantId } from "@/lib/auth";
import { getInvoiceForTenant } from "@/lib/invoices/repository";
import { listCustomersForTenant } from "@/lib/customers/repository";
import { InvoiceDetail } from "@/components/invoices/invoice-detail";
import { InvoiceEmailActions } from "@/components/invoices/invoice-email-actions";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenantId = await getTenantId();
  const [csrf, invoice, customers] = await Promise.all([
    getCsrfToken(),
    getInvoiceForTenant(tenantId, id),
    listCustomersForTenant(tenantId),
  ]);
  if (!invoice) notFound();

  return (
    <InvoiceDetail
      csrf={csrf}
      customers={customers.map((c) => ({ id: c.id, name: c.name }))}
      sendSlot={<InvoiceEmailActions csrf={csrf} invoiceId={invoice.id} />}
      invoice={{
        id: invoice.id,
        number: invoice.number,
        variableSymbol: invoice.variableSymbol,
        status: invoice.status,
        totalCents: invoice.totalCents,
        issuedAt: invoice.issuedAt,
        dueDate: invoice.dueDate,
        sentAt: invoice.sentAt,
        paidAt: invoice.paidAt,
        customer: {
          id: invoice.customer.id,
          name: invoice.customer.name,
          ico: invoice.customer.ico,
          dic: invoice.customer.dic,
          address: invoice.customer.address,
          email: invoice.customer.email,
          phone: invoice.customer.phone,
        },
        items: invoice.items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          priceCents: item.priceCents,
          category: item.category,
        })),
        payments: invoice.payments.map((p) => ({
          id: p.id,
          amountCents: p.amountCents,
          bookedAt: p.bookedAt,
          message: p.message,
        })),
      }}
    />
  );
}
