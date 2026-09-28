import type { CheckoutCartLine } from "@/lib/receipts/checkout-schema";
import type { CartLine } from "./types";

export function serializeCartForCheckout(cart: CartLine[]): CheckoutCartLine[] {
  return cart.map((line) => {
    if (line.kind === "catalog") {
      return {
        kind: "catalog" as const,
        priceItemId: line.priceItemId,
        name: line.name,
        priceCents: line.priceCents,
        category: line.category,
        quantity: line.quantity,
      };
    }
    return {
      kind: "custom" as const,
      name: line.name,
      priceCents: line.priceCents,
      category: line.category,
      quantity: line.quantity,
    };
  });
}
