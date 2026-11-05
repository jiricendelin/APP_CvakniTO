import { prisma } from "@/lib/prisma";
import type { VoucherStatus } from "./status";

export async function listVouchersForTenant(
  tenantId: string,
  status?: VoucherStatus
) {
  return prisma.voucher.findMany({
    where: {
      tenantId,
      ...(status ? { status } : {}),
    },
    include: {
      receipt: {
        select: {
          id: true,
          number: true,
          variableSymbol: true,
          paidAt: true,
          totalCents: true,
        },
      },
      priceItem: { select: { id: true, name: true } },
      giftCustomer: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getVoucherForTenant(tenantId: string, id: string) {
  return prisma.voucher.findFirst({
    where: { id, tenantId },
    include: {
      receipt: {
        include: {
          items: true,
          payments: { orderBy: { createdAt: "desc" } },
        },
      },
      priceItem: true,
      giftCustomer: true,
    },
  });
}

export async function getVoucherByReceiptId(
  tenantId: string,
  receiptId: string
) {
  return prisma.voucher.findFirst({
    where: { tenantId, receiptId },
  });
}

export async function listGiftEligiblePriceItems(tenantId: string) {
  return prisma.priceItem.findMany({
    where: { tenantId, active: true, giftEligible: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}
