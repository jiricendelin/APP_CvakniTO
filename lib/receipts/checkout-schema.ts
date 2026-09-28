import { z } from "zod";
import { PRICE_CATEGORIES } from "@/lib/pricelist/categories";
import { PAYMENT_TYPES } from "./payment-type";

const cartLineBase = {
  name: z.string().min(1).max(200),
  priceCents: z.number().int().min(1),
  category: z.enum(PRICE_CATEGORIES),
  quantity: z.number().int().min(1).max(999),
};

export const checkoutCartLineSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("catalog"),
    priceItemId: z.string().uuid(),
    ...cartLineBase,
  }),
  z.object({
    kind: z.literal("custom"),
    ...cartLineBase,
  }),
]);

export const checkoutPayloadSchema = z.object({
  paymentType: z.enum(PAYMENT_TYPES),
  printOnIssue: z.boolean(),
  cart: z.array(checkoutCartLineSchema).min(1),
});

export type CheckoutCartLine = z.infer<typeof checkoutCartLineSchema>;
