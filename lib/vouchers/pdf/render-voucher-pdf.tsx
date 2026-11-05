import { readFile } from "node:fs/promises";
import { renderToBuffer } from "@react-pdf/renderer";
import type { TenantSettings } from "@/lib/settings/schema";
import { formatPragueDateCz } from "@/lib/time/prague-parts";
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

async function loadImageDataUrl(
  tenantId: string,
  filename: string
): Promise<string | null> {
  if (!filename) return null;
  const full = resolveVoucherArtFile(tenantId, filename);
  if (!full) return null;
  try {
    const buf = await readFile(full);
    const ext = filename.toLowerCase().endsWith(".png") ? "png" : "jpeg";
    return `data:image/${ext};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function renderVoucherPdfBuffer(
  input: VoucherPdfInput
): Promise<Buffer> {
  const fronts = input.settings.voucherFrontImages ?? {};
  let frontFile = "";
  if (input.kind === "value") {
    frontFile = input.settings.voucherValueFrontImage ?? "";
  } else if (input.priceItemId) {
    frontFile = fronts[input.priceItemId] ?? "";
  }

  const [frontImageSrc, backImageSrc] = await Promise.all([
    loadImageDataUrl(input.tenantId, frontFile),
    loadImageDataUrl(input.tenantId, input.settings.voucherBackImage ?? ""),
  ]);

  const buffer = await renderToBuffer(
    <VoucherPdfDocument
      frontImageSrc={frontImageSrc}
      backImageSrc={backImageSrc}
      number={input.number}
      validUntilLabel={`Platnost do: ${formatPragueDateCz(input.validUntil)}`}
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
