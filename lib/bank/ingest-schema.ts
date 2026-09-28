import { z } from "zod";

export const bankIngestPayloadSchema = z.object({
  tenantId: z.string().uuid(),
  moveId: z.string().min(1).max(100),
  variableSymbol: z.string().min(1).max(20),
  amountCents: z.number().int().positive(),
  bookedAt: z.string().datetime().optional(),
  message: z.string().max(500).optional().default(""),
});

export type BankIngestPayload = z.infer<typeof bankIngestPayloadSchema>;
