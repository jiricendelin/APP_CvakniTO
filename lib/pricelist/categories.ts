export const PRICE_CATEGORIES = ["masaze", "pedikura", "ostatni"] as const;

export type PriceCategory = (typeof PRICE_CATEGORIES)[number];

export const PRICE_CATEGORY_LABELS: Record<PriceCategory, string> = {
  masaze: "Masáže",
  pedikura: "Pedikúra",
  ostatni: "Prodej a ostatní",
};

export function isPriceCategory(value: string): value is PriceCategory {
  return (PRICE_CATEGORIES as readonly string[]).includes(value);
}
