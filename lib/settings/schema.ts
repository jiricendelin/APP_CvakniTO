import { z } from "zod";
import { isValidIban, normalizeIban } from "@/lib/iban";
import { DEFAULT_PRIMARY_COLOR } from "@/lib/color";

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Zadejte barvu ve formátu #RRGGBB");

export const tenantSettingsSchema = z.object({
  companyName: z.string().max(200).optional().default(""),
  companyIco: z.string().max(20).optional().default(""),
  companyDic: z.string().max(20).optional().default(""),
  companyAddress: z.string().max(500).optional().default(""),
  bankAccount: z.string().max(40).optional().default(""),
  iban: z.string().max(40).optional().default(""),
  primaryColor: hexColor.optional().default(DEFAULT_PRIMARY_COLOR),
});

export type TenantSettings = z.infer<typeof tenantSettingsSchema>;

export function parseTenantSettings(raw: unknown): TenantSettings {
  const parsed = tenantSettingsSchema.safeParse(raw ?? {});
  if (parsed.success) return parsed.data;
  return tenantSettingsSchema.parse({});
}

export const settingsFormSchema = z
  .object({
    companyName: z.string().max(200),
    companyIco: z.string().max(20),
    companyDic: z.string().max(20),
    companyAddress: z.string().max(500),
    bankAccount: z.string().max(40),
    iban: z.string().max(40),
    primaryColor: hexColor,
  })
  .superRefine((data, ctx) => {
    const iban = normalizeIban(data.iban);
    if (iban && !isValidIban(iban)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Neplatný IBAN. Zkontrolujte formát a kontrolní číslice.",
        path: ["iban"],
      });
    }
  });

export function formToSettings(
  data: z.infer<typeof settingsFormSchema>
): TenantSettings {
  return {
    companyName: data.companyName.trim(),
    companyIco: data.companyIco.trim(),
    companyDic: data.companyDic.trim(),
    companyAddress: data.companyAddress.trim(),
    bankAccount: data.bankAccount.trim(),
    iban: normalizeIban(data.iban),
    primaryColor: data.primaryColor.toLowerCase(),
  };
}
