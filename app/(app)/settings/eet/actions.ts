"use server";

import { writeFile, unlink } from "node:fs/promises";
import { revalidatePath } from "next/cache";
import { getTenantId } from "@/lib/auth";
import { assertCsrf } from "@/lib/auth/csrf";
import { encryptSecret } from "@/lib/crypto/encrypt-secret";
import { readCertInfoFromP12 } from "@/lib/eet/cert-info";
import {
  ensureEetDataDir,
  getTenantCertPath,
  tenantCertExists,
} from "@/lib/eet/cert-path";
import { eetConfigFormSchema } from "@/lib/eet/settings-schema";
import {
  getTenantSettings,
  saveTenantSettings,
} from "@/lib/settings/repository";

export type EetSettingsFormState = {
  error?: string;
  success?: boolean;
  certUploaded?: boolean;
};

export async function updateEetConfigAction(
  _prev: EetSettingsFormState,
  formData: FormData
): Promise<EetSettingsFormState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const parsed = eetConfigFormSchema.safeParse({
    eetPremiseId: formData.get("eetPremiseId") ?? "",
    eetRegisterId: formData.get("eetRegisterId") ?? "",
    eetPlayground: formData.get("eetPlayground") === "on",
    eetAutoSend: formData.get("eetAutoSend") === "on",
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Neplatná data EET.",
    };
  }

  const tenantId = await getTenantId();
  const current = await getTenantSettings(tenantId);

  await saveTenantSettings(tenantId, {
    ...current,
    eetPremiseId: parsed.data.eetPremiseId.trim(),
    eetRegisterId: parsed.data.eetRegisterId.trim(),
    eetPlayground: parsed.data.eetPlayground,
    eetAutoSend: parsed.data.eetAutoSend,
  });

  revalidatePath("/settings/eet");
  return { success: true };
}

export async function uploadEetCertAction(
  _prev: EetSettingsFormState,
  formData: FormData
): Promise<EetSettingsFormState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const file = formData.get("certFile");
  const password = String(formData.get("certPassword") ?? "");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Vyberte soubor .p12." };
  }
  if (!password) {
    return { error: "Zadejte heslo k certifikátu." };
  }
  if (file.size > 512_000) {
    return { error: "Soubor certifikátu je příliš velký." };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const info = await readCertInfoFromP12(bytes, password);
  if (!info.ok) {
    if (info.error === "wrong_password") {
      return { error: "Heslo k certifikátu není správné." };
    }
    return { error: "Certifikát nelze načíst — zkontrolujte soubor .p12." };
  }

  const tenantId = await getTenantId();
  await ensureEetDataDir();
  await writeFile(getTenantCertPath(tenantId), bytes);

  const current = await getTenantSettings(tenantId);
  await saveTenantSettings(tenantId, {
    ...current,
    eetCertPasswordEnc: encryptSecret(password),
    eetCertSubject: info.info.subject,
    eetCertValidTo: info.info.validTo,
    eetCertUploadedAt: new Date().toISOString(),
    eetTaxpayerId: info.info.taxpayerId || current.eetTaxpayerId,
  });

  revalidatePath("/settings/eet");
  return { success: true, certUploaded: true };
}

export async function removeEetCertAction(
  _prev: EetSettingsFormState,
  formData: FormData
): Promise<EetSettingsFormState> {
  try {
    await assertCsrf(formData);
  } catch {
    return { error: "Neplatný CSRF token. Obnovte stránku." };
  }

  const tenantId = await getTenantId();
  if (await tenantCertExists(tenantId)) {
    await unlink(getTenantCertPath(tenantId)).catch(() => undefined);
  }

  const current = await getTenantSettings(tenantId);
  await saveTenantSettings(tenantId, {
    ...current,
    eetCertPasswordEnc: "",
    eetCertSubject: "",
    eetCertValidTo: "",
    eetCertUploadedAt: "",
  });

  revalidatePath("/settings/eet");
  return { success: true };
}
