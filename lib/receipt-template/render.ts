import "server-only";
import { getReceiptHandlebars } from "./handlebars-instance";
import { buildSampleReceiptContext } from "./sample-context";
import type { ReceiptTemplateContext } from "./types";
import type { TenantSettings } from "@/lib/settings/schema";

export type RenderReceiptTemplateResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export function renderReceiptTemplate(
  templateSource: string,
  context: ReceiptTemplateContext
): RenderReceiptTemplateResult {
  const trimmed = templateSource.trim();
  if (!trimmed) {
    return { ok: false, error: "Šablona je prázdná." };
  }

  try {
    const Handlebars = getReceiptHandlebars();
    const template = Handlebars.compile(trimmed, {
      strict: false,
      noEscape: true,
    });
    const text = template(context);
    if (typeof text !== "string") {
      return { ok: false, error: "Šablona nevrátila text." };
    }
    return { ok: true, text };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Neplatná Handlebars šablona.";
    return { ok: false, error: message };
  }
}

export function validateReceiptTemplate(
  templateSource: string,
  settings: Pick<
    TenantSettings,
    | "companyName"
    | "companyIco"
    | "companyDic"
    | "companyAddress"
    | "bankAccount"
    | "iban"
  >
): RenderReceiptTemplateResult {
  const sample = buildSampleReceiptContext(settings);
  return renderReceiptTemplate(templateSource, sample);
}
