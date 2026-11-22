"use server";

import { revalidatePath } from "next/cache";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import {
  getTenantSettings,
  saveTenantSettings,
} from "@/lib/settings/repository";

export type MailExtraFormState = {
  error?: string;
  success?: string;
};

export async function updateMailSignatureAndImapAction(
  _prev: MailExtraFormState,
  formData: FormData
): Promise<MailExtraFormState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token." };
  }

  const tenantId = await getTenantId();
  const current = await getTenantSettings(tenantId);

  const imapPort = parseInt(String(formData.get("imapPort") ?? "993"), 10);

  await saveTenantSettings(tenantId, {
    ...current,
    mailSignatureHtml: String(formData.get("mailSignatureHtml") ?? ""),
    mailSignatureText: String(formData.get("mailSignatureText") ?? ""),
    imapEnabled: formData.get("imapEnabled") === "true",
    imapHost: String(formData.get("imapHost") ?? "").trim(),
    imapPort: Number.isFinite(imapPort) ? imapPort : 993,
    imapSecure: formData.get("imapSecure") !== "false",
    imapSentFolder: String(formData.get("imapSentFolder") ?? "Sent").trim() || "Sent",
  });

  revalidatePath("/settings");
  return { success: "Podpis a IMAP uloženy." };
}
