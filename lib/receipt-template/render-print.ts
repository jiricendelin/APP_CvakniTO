import type { TenantSettings } from "@/lib/settings/schema";
import { getReceiptTemplateSource } from "@/lib/settings/schema";
import {
  buildReceiptTemplateContext,
  type ReceiptForTemplate,
} from "./build-context";
import { renderReceiptTemplate } from "./render";

export type ReceiptPrintPayload = {
  text: string;
  qrSpayd: string | null;
};

export function renderReceiptPrintPayload(
  settings: TenantSettings,
  receipt: ReceiptForTemplate
): ReceiptPrintPayload | null {
  const template = getReceiptTemplateSource(settings);
  const context = buildReceiptTemplateContext(settings, receipt);
  const rendered = renderReceiptTemplate(template, context);
  if (!rendered.ok) return null;
  return {
    text: rendered.text,
    qrSpayd: context.qrSpayd,
  };
}
