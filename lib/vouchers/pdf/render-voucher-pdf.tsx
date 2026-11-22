import { readFile } from "node:fs/promises";
import { renderToBuffer } from "@react-pdf/renderer";
import type { TenantSettings } from "@/lib/settings/schema";
import {
  addMonthsPrague,
  formatPragueDateCz,
} from "@/lib/time/prague-parts";
import { registerInvoicePdfFonts } from "@/lib/invoices/pdf/register-fonts";
import { resolveVoucherArtFile } from "../art-path";
import { VoucherPdfDocument } from "./voucher-pdf-document";

export type VoucherPdfInput = {
  tenantId: string;
  settings: TenantSettings;
  number: string;
  validUntil: Date;
  kind: string;
  priceItemId: string | null;
  serviceName: string;
};

async function loadImage(
  tenantId: string,
  filename: string
): Promise<Buffer | null> {
  if (!filename) return null;
  const full = resolveVoucherArtFile(tenantId, filename);
  if (!full) return null;
  try {
    return await readFile(full);
  } catch {
    return null;
  }
}

export async function renderVoucherPdfBuffer(
  input: VoucherPdfInput
): Promise<Buffer> {
  registerInvoicePdfFonts();

  const fronts = input.settings.voucherFrontImages ?? {};
  let frontFile = "";
  if (input.priceItemId) {
    frontFile = fronts[input.priceItemId] ?? "";
  }
  // Starší hodnotové poukazy bez položky ceníku.
  if (!frontFile && input.kind === "value") {
    frontFile = input.settings.voucherValueFrontImage ?? "";
  }

  const [frontImageSrc, backImageSrc] = await Promise.all([
    loadImage(input.tenantId, frontFile),
    loadImage(input.tenantId, input.settings.voucherBackImage ?? ""),
  ]);

  const buffer = await renderToBuffer(
    <VoucherPdfDocument
      frontImageSrc={frontImageSrc}
      backImageSrc={backImageSrc}
      number={input.number}
      validUntilLabel={formatPragueDateCz(input.validUntil)}
      numberX={input.settings.voucherNumberX ?? 50}
      numberY={input.settings.voucherNumberY ?? 70}
      validX={input.settings.voucherValidX ?? 50}
      validY={input.settings.voucherValidY ?? 80}
      numberFontSize={input.settings.voucherNumberFontSize ?? 14}
      validFontSize={input.settings.voucherValidFontSize ?? 14}
      fallbackTitle={input.serviceName || "Dárkový poukaz"}
    />
  );

  return Buffer.from(buffer);
}

export type VoucherArtPreviewOverrides = {
  voucherNumberX?: number;
  voucherNumberY?: number;
  voucherValidX?: number;
  voucherValidY?: number;
  voucherNumberFontSize?: number;
  voucherValidFontSize?: number;
};

/** Náhled A4 s výplňkovými údaji — pro ladění pozic na zadní straně. */
export async function renderVoucherArtPreviewPdf(
  tenantId: string,
  settings: TenantSettings,
  overrides: VoucherArtPreviewOverrides = {}
): Promise<Buffer> {
  const merged: TenantSettings = {
    ...settings,
    voucherNumberX: overrides.voucherNumberX ?? settings.voucherNumberX,
    voucherNumberY: overrides.voucherNumberY ?? settings.voucherNumberY,
    voucherValidX: overrides.voucherValidX ?? settings.voucherValidX,
    voucherValidY: overrides.voucherValidY ?? settings.voucherValidY,
    voucherNumberFontSize:
      overrides.voucherNumberFontSize ?? settings.voucherNumberFontSize,
    voucherValidFontSize:
      overrides.voucherValidFontSize ?? settings.voucherValidFontSize,
  };

  const frontIds = Object.keys(merged.voucherFrontImages ?? {});
  return renderVoucherPdfBuffer({
    tenantId,
    settings: merged,
    number: "DP-2026-0001",
    validUntil: addMonthsPrague(new Date(), 6),
    kind: "service",
    priceItemId: frontIds[0] ?? null,
    serviceName: "Náhled poukazu",
  });
}
