import type { ReceiptPrintPayload } from "@/lib/receipt-template/render-print";
import { RASTER_WIDTH_PX } from "./constants";
import {
  bitmapFromCanvas,
  concatBytes,
  escposFeed,
  escposInit,
  escposQrNative,
  escposRaster,
  escposTextCp852,
} from "./escpos";
import type { PrinterPrefs } from "./printer-prefs";
import { renderReceiptTextToCanvas } from "./receipt-text-canvas";
import { renderQrToCanvas } from "./raster-client";

export async function buildReceiptPrintJob(
  payload: ReceiptPrintPayload,
  prefs: PrinterPrefs
): Promise<Uint8Array> {
  const textCanvas = renderReceiptTextToCanvas(payload.text, RASTER_WIDTH_PX);
  const textRaster = bitmapFromCanvas(textCanvas);

  const parts: Uint8Array[] = [
    escposInit(),
    escposRaster(textRaster.bitmap, textRaster.width, textRaster.height),
  ];

  if (payload.qrSpayd) {
    parts.push(escposTextCp852("\n"));
    if (prefs.qrMode === "qr-native") {
      parts.push(escposQrNative(payload.qrSpayd));
    } else {
      const qrCanvas = await renderQrToCanvas(payload.qrSpayd, 280);
      const qrRaster = bitmapFromCanvas(qrCanvas);
      parts.push(
        escposRaster(qrRaster.bitmap, qrRaster.width, qrRaster.height)
      );
    }
  }

  parts.push(escposFeed(4));
  return concatBytes(...parts);
}
