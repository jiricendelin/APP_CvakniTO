import { z } from "zod";

export const SMTP_ENCRYPTIONS = ["ssl", "starttls"] as const;
export type SmtpEncryption = (typeof SMTP_ENCRYPTIONS)[number];

export const smtpSettingsSchema = z.object({
  smtpHost: z.string().max(200).optional().default(""),
  smtpPort: z.number().int().min(1).max(65535).optional().default(587),
  smtpEncryption: z.enum(SMTP_ENCRYPTIONS).optional().default("starttls"),
  smtpUser: z.string().max(200).optional().default(""),
  smtpPassword: z.string().max(500).optional().default(""),
  smtpFromEmail: z.string().max(200).optional().default(""),
  smtpFromName: z.string().max(200).optional().default(""),
});

export type SmtpSettings = z.infer<typeof smtpSettingsSchema>;

export function parseSmtpSettings(raw: unknown): SmtpSettings {
  const parsed = smtpSettingsSchema.safeParse(raw ?? {});
  if (parsed.success) return parsed.data;
  return smtpSettingsSchema.parse({});
}

export function smtpFormSchema() {
  return z.object({
    smtpHost: z.string().max(200),
    smtpPort: z.coerce.number().int().min(1).max(65535),
    smtpEncryption: z.enum(SMTP_ENCRYPTIONS),
    smtpUser: z.string().max(200),
    smtpPassword: z.string().max(500),
    smtpFromEmail: z.string().max(200),
    smtpFromName: z.string().max(200),
  });
}
