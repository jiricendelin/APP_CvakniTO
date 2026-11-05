"use server";

import { revalidatePath } from "next/cache";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import {
  getTenantSettings,
  saveTenantSettings,
} from "@/lib/settings/repository";
import { saveVoucherArtFile } from "@/lib/vouchers/art-path";

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

export async function updateVoucherArtAction(
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

  const numberX = parseFloat(String(formData.get("voucherNumberX") ?? "50"));
  const numberY = parseFloat(String(formData.get("voucherNumberY") ?? "70"));
  const validX = parseFloat(String(formData.get("voucherValidX") ?? "50"));
  const validY = parseFloat(String(formData.get("voucherValidY") ?? "80"));
  const numberFontSize = parseFloat(
    String(formData.get("voucherNumberFontSize") ?? "14")
  );
  const validFontSize = parseFloat(
    String(formData.get("voucherValidFontSize") ?? "14")
  );

  let voucherBackImage = current.voucherBackImage ?? "";
  let voucherValueFrontImage = current.voucherValueFrontImage ?? "";
  const fronts = { ...(current.voucherFrontImages ?? {}) };

  const backFile = formData.get("backImage");
  if (backFile instanceof File && backFile.size > 0) {
    if (backFile.size > 5 * 1024 * 1024) {
      return { error: "Zadní strana max 5 MB." };
    }
    const buf = Buffer.from(await backFile.arrayBuffer());
    voucherBackImage = await saveVoucherArtFile(
      tenantId,
      `back-${Date.now()}.jpg`,
      buf
    );
  }

  const valueFront = formData.get("valueFrontImage");
  if (valueFront instanceof File && valueFront.size > 0) {
    if (valueFront.size > 5 * 1024 * 1024) {
      return { error: "Přední strana (hodnota) max 5 MB." };
    }
    const buf = Buffer.from(await valueFront.arrayBuffer());
    voucherValueFrontImage = await saveVoucherArtFile(
      tenantId,
      `value-front-${Date.now()}.jpg`,
      buf
    );
  }

  const priceItemId = String(formData.get("priceItemId") ?? "").trim();
  const serviceFront = formData.get("serviceFrontImage");
  if (
    priceItemId &&
    serviceFront instanceof File &&
    serviceFront.size > 0
  ) {
    if (serviceFront.size > 5 * 1024 * 1024) {
      return { error: "Přední strana max 5 MB." };
    }
    const buf = Buffer.from(await serviceFront.arrayBuffer());
    fronts[priceItemId] = await saveVoucherArtFile(
      tenantId,
      `front-${priceItemId.slice(0, 8)}-${Date.now()}.jpg`,
      buf
    );
  }

  await saveTenantSettings(tenantId, {
    ...current,
    voucherBackImage,
    voucherValueFrontImage,
    voucherFrontImages: fronts,
    voucherNumberX: Number.isFinite(numberX) ? numberX : 50,
    voucherNumberY: Number.isFinite(numberY) ? numberY : 70,
    voucherValidX: Number.isFinite(validX) ? validX : 50,
    voucherValidY: Number.isFinite(validY) ? validY : 80,
    voucherNumberFontSize: Number.isFinite(numberFontSize) ? numberFontSize : 14,
    voucherValidFontSize: Number.isFinite(validFontSize) ? validFontSize : 14,
  });

  revalidatePath("/settings");
  return { success: "Grafika poukazu uložena." };
}
