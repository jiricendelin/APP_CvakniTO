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
      receipt: { select: { id: true, number: true } },
      invoice: { select: { id: true, number: true } },
    },
  });
}
