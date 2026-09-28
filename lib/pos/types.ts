import type { PriceCategory } from "@/lib/pricelist/categories";

export type CatalogProduct = {
  id: string;
  name: string;
  priceCents: number;
  category: PriceCategory;
};

export type CartLine =
  | {
      key: string;
      kind: "catalog";
      priceItemId: string;
      name: string;
      priceCents: number;
      category: PriceCategory;
      quantity: number;
    }
  | {
      key: string;
      kind: "custom";
      name: string;
      priceCents: number;
      category: PriceCategory;
      quantity: number;
    };

export function lineTotal(line: CartLine): number {
  return line.priceCents * line.quantity;
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0);
}
