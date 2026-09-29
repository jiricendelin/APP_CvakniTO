import { prisma } from "@/lib/prisma";
import type { ReceiptListFilters } from "./list-filters";
import { buildReceiptListWhere } from "./list-filters";

export async function getReceiptForTenant(tenantId: string, id: string) {
  return prisma.receipt.findFirst({
    where: { id, tenantId },
    include: {
      items: { orderBy: { name: "asc" } },
    },
  });
}

export async function listReceiptsForTenant(
  tenantId: string,
  filters: ReceiptListFilters
) {
  return prisma.receipt.findMany({
    where: buildReceiptListWhere(tenantId, filters),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      number: true,
      paymentType: true,
      totalCents: true,
      eetStatus: true,
      paidAt: true,
      createdAt: true,
    },
    take: 200,
  });
}
