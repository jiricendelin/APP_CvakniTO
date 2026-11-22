import {
  getTenantSettings,
  saveTenantSettings,
} from "@/lib/settings/repository";
import { saveVoucherArtFile } from "@/lib/vouchers/art-path";

export type VoucherArtSaveResult = {
  error?: string;
  success?: string;
};

function extForFile(file: File, buf: Buffer): string {
  if (file.type === "image/png" || buf[0] === 0x89) return "png";
  if (
    file.type === "image/jpeg" ||
    file.type === "image/jpg" ||
    (buf[0] === 0xff && buf[1] === 0xd8)
  ) {
    return "jpg";
  }
  return "jpg";
}

export async function saveVoucherArtFromForm(
  tenantId: string,
  formData: FormData
): Promise<VoucherArtSaveResult> {
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
  const fronts = { ...(current.voucherFrontImages ?? {}) };

  const backFile = formData.get("backImage");
  if (backFile instanceof File && backFile.size > 0) {
    if (backFile.size > 5 * 1024 * 1024) {
      return { error: "Zadní strana max 5 MB." };
    }
    const buf = Buffer.from(await backFile.arrayBuffer());
    const ext = extForFile(backFile, buf);
    voucherBackImage = await saveVoucherArtFile(
      tenantId,
      `back-${Date.now()}.${ext}`,
      buf
    );
  }

  const priceItemId = String(formData.get("priceItemId") ?? "").trim();
  const serviceFront = formData.get("serviceFrontImage");
  if (priceItemId && serviceFront instanceof File && serviceFront.size > 0) {
    if (serviceFront.size > 5 * 1024 * 1024) {
      return { error: "Přední strana max 5 MB." };
    }
    const buf = Buffer.from(await serviceFront.arrayBuffer());
    const ext = extForFile(serviceFront, buf);
    fronts[priceItemId] = await saveVoucherArtFile(
      tenantId,
      `front-${priceItemId.slice(0, 8)}-${Date.now()}.${ext}`,
      buf
    );
  }

  await saveTenantSettings(tenantId, {
    ...current,
    voucherBackImage,
    voucherFrontImages: fronts,
    voucherNumberX: Number.isFinite(numberX) ? numberX : 50,
    voucherNumberY: Number.isFinite(numberY) ? numberY : 70,
    voucherValidX: Number.isFinite(validX) ? validX : 50,
    voucherValidY: Number.isFinite(validY) ? validY : 80,
    voucherNumberFontSize: Number.isFinite(numberFontSize) ? numberFontSize : 14,
    voucherValidFontSize: Number.isFinite(validFontSize) ? validFontSize : 14,
  });

  return { success: "Grafika poukazu uložena." };
}
