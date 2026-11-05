import { prisma } from "@/lib/prisma";

export async function getPaymentForTenant(tenantId: string, id: string) {
  return prisma.payment.findFirst({
    where: { id, tenantId },
  });
}

export async function listPaymentsForTenant(tenantId: string) {
  return prisma.payment.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      receipt: { select: { id: true, number: true, paidAt: true } },
      invoice: { select: { id: true, number: true } },
    },
  });
}

export async function listUnmatchedPaymentsForTenant(tenantId: string) {
  return prisma.payment.findMany({
    where: { tenantId, matched: false },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      amountCents: true,
      variableSymbol: true,
      message: true,
      createdAt: true,
    },
  });
}
