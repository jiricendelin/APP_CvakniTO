/**
 * R25: smoke test izolace tenantů v repository vrstvě.
 * Vyžaduje běžící DB a alespoň dva tenanty s daty (nebo vytvoří dočasná).
 */
import { prisma } from "../lib/prisma";
import { getReceiptForTenant } from "../lib/receipts/repository";
import { getInvoiceForTenant } from "../lib/invoices/repository";
import { getCustomerForTenant } from "../lib/customers/repository";
import { getPaymentForTenant } from "../lib/payments/repository";

async function main() {
  const tenants = await prisma.tenant.findMany({ take: 2, select: { id: true } });
  if (tenants.length < 2) {
    console.log("test-tenant-isolation: SKIP (méně než 2 tenanty v DB)");
    return;
  }

  const [a, b] = tenants;
  const receiptA = await prisma.receipt.findFirst({
    where: { tenantId: a!.id },
    select: { id: true },
  });
  if (!receiptA) {
    console.log("test-tenant-isolation: SKIP (tenant A nemá účtenku)");
    return;
  }

  const cross = await getReceiptForTenant(b!.id, receiptA.id);
  if (cross !== null) {
    throw new Error("Únik: tenant B vidí účtenku tenant A");
  }

  const invoiceA = await prisma.invoice.findFirst({
    where: { tenantId: a!.id },
    select: { id: true },
  });
  if (invoiceA) {
    const crossInv = await getInvoiceForTenant(b!.id, invoiceA.id);
    if (crossInv !== null) {
      throw new Error("Únik: tenant B vidí fakturu tenant A");
    }
  }

  const customerA = await prisma.customer.findFirst({
    where: { tenantId: a!.id },
    select: { id: true },
  });
  if (customerA) {
    const crossCust = await getCustomerForTenant(b!.id, customerA.id);
    if (crossCust !== null) {
      throw new Error("Únik: tenant B vidí zákazníka tenant A");
    }
  }

  const paymentA = await prisma.payment.findFirst({
    where: { tenantId: a!.id },
    select: { id: true },
  });
  if (paymentA) {
    const crossPay = await getPaymentForTenant(b!.id, paymentA.id);
    if (crossPay !== null) {
      throw new Error("Únik: tenant B vidí platbu tenant A");
    }
  }

  console.log("test-tenant-isolation: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
