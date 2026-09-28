import { z } from "zod";
import { PRICE_CATEGORIES } from "@/lib/pricelist/categories";

const lineSchema = z.object({
  name: z.string().trim().min(1, "Název položky je povinný.").max(200),
  quantity: z.number().int().min(1).max(9999),
  priceCents: z.number().int().min(0),
  category: z.enum(PRICE_CATEGORIES),
});

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid("Vyberte zákazníka."),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Zadejte datum splatnosti."),
  lines: z.array(lineSchema).min(1, "Přidejte alespoň jednu položku."),
});

export type CreateInvoiceLine = z.infer<typeof lineSchema>;
