import type { PriceCategory } from "./categories";

export type DefaultPriceItem = {
  name: string;
  priceCents: number;
  category: PriceCategory;
  sortOrder: number;
};

/** Výchozí položky ze zadání (ceny v haléřích). */
export const DEFAULT_PRICE_ITEMS: DefaultPriceItem[] = [
  { name: "Masáž", priceCents: 80000, category: "masaze", sortOrder: 10 },
  { name: "Masáž dva", priceCents: 100000, category: "masaze", sortOrder: 20 },
  { name: "Masáž tři", priceCents: 150000, category: "masaze", sortOrder: 30 },
  { name: "Pedikúra", priceCents: 60000, category: "pedikura", sortOrder: 40 },
  {
    name: "Pedikúra s lakováním",
    priceCents: 70000,
    category: "pedikura",
    sortOrder: 50,
  },
];
