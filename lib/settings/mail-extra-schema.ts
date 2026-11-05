import { z } from "zod";

/** Podpis e-mailu + IMAP pro kopii do Odeslané + grafika poukazu. */
export const mailExtraSettingsSchema = z.object({
  mailSignatureHtml: z.string().max(50_000).optional().default(""),
  mailSignatureText: z.string().max(20_000).optional().default(""),
  imapHost: z.string().max(200).optional().default(""),
  imapPort: z.number().int().min(1).max(65535).optional().default(993),
  imapSecure: z.boolean().optional().default(true),
  imapSentFolder: z.string().max(200).optional().default("Sent"),
  imapEnabled: z.boolean().optional().default(false),
  /** Relativní cesty k souborům v data/vouchers/{tenantId}/ */
  voucherBackImage: z.string().max(500).optional().default(""),
  voucherValueFrontImage: z.string().max(500).optional().default(""),
  /** Pozice textu na zadní straně v % šířky/výšky stránky (0–100). */
  voucherNumberX: z.number().min(0).max(100).optional().default(50),
  voucherNumberY: z.number().min(0).max(100).optional().default(70),
  voucherValidX: z.number().min(0).max(100).optional().default(50),
  voucherValidY: z.number().min(0).max(100).optional().default(80),
  voucherNumberFontSize: z.number().min(6).max(72).optional().default(14),
  voucherValidFontSize: z.number().min(6).max(72).optional().default(14),
  /** Mapa priceItemId → název souboru přední strany. */
  voucherFrontImages: z
    .record(z.string().max(500))
    .optional()
    .default({}),
});

export type MailExtraSettings = z.infer<typeof mailExtraSettingsSchema>;
