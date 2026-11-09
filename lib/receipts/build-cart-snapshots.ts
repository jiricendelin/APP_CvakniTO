import { prisma } from "@/lib/prisma";
import { isPriceCategory } from "@/lib/pricelist/categories";
import type { CheckoutCartLine } from "./checkout-schema";

export type ReceiptItemSnapshot = {
  priceItemId: string | null;
  name: string;
  priceCents: number;
  quantity: number;
  category: string;
  lineTotalCents: number;
};

export async function buildReceiptItemSnapshotsFromCart(
  tenantId: string,
  cart: CheckoutCartLine[]
): Promise<ReceiptItemSnapshot[]> {
  const snapshotLines: ReceiptItemSnapshot[] = [];

  for (const line of cart) {
    if (line.kind === "catalog") {
      const item = await prisma.priceItem.findFirst({
        where: {
          id: line.priceItemId,
          tenantId,
          active: true,
        },
      });
      if (!item || !isPriceCategory(item.category)) {
        throw new Error(`Položka ceníku „${line.name}“ už není k dispozici.`);
      }
      snapshotLines.push({
        priceItemId: item.id,
        name: item.name,
        priceCents: item.priceCents,
        quantity: line.quantity,
        category: item.category,
        lineTotalCents: item.priceCents * line.quantity,
      });
      continue;
    }

    if (!isPriceCategory(line.category)) {
      throw new Error("Neplatná kategorie položky.");
    }
    snapshotLines.push({
      priceItemId: null,
      name: line.name.trim(),
      priceCents: line.priceCents,
      quantity: line.quantity,
      category: line.category,
      lineTotalCents: line.priceCents * line.quantity,
    });
  }

  return snapshotLines;
}
