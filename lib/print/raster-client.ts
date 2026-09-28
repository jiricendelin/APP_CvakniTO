import QRCode from "qrcode";

export async function renderQrToCanvas(
  payload: string,
  widthPx: number
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, payload, {
    width: widthPx,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
  return canvas;
}
