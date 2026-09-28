import { z } from "zod";

export const eetSettingsSchema = z.object({
  eetPremiseId: z.string().max(20).optional().default(""),
  eetRegisterId: z.string().max(20).optional().default(""),
  eetTaxpayerId: z.string().max(20).optional().default(""),
  eetPlayground: z.boolean().optional().default(true),
  eetAutoSend: z.boolean().optional().default(false),
  eetCertPasswordEnc: z.string().max(2000).optional().default(""),
  eetCertSubject: z.string().max(500).optional().default(""),
  eetCertValidTo: z.string().max(40).optional().default(""),
  eetCertUploadedAt: z.string().max(40).optional().default(""),
});

export type EetSettings = z.infer<typeof eetSettingsSchema>;

export const eetConfigFormSchema = z.object({
  eetPremiseId: z
    .string()
    .regex(/^[1-9][0-9]{0,8}$/, "ID provozovny: 1–999999999"),
  eetRegisterId: z
    .string()
    .min(1, "Vyplňte ID pokladny")
    .max(20)
    .regex(
      /^[0-9a-zA-Z.,:;/#\-_ ]{1,20}$/,
      "ID pokladny: max. 20 znaků (povolené znaky dle EET)"
    ),
  eetPlayground: z.boolean(),
  eetAutoSend: z.boolean(),
});
