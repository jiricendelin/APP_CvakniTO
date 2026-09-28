import { RASTER_WIDTH_PX } from "./constants";

const RECEIPT_CHARS_PER_LINE = 32;

/** Rastr účtenky — monospace, zachová řádky ze šablony. */
export function renderReceiptTextToCanvas(
  text: string,
  widthPx = RASTER_WIDTH_PX,
  fontSize = 12
): HTMLCanvasElement {
  const padding = 4;
  const lineHeight = Math.ceil(fontSize * 1.35);
  const font = `${fontSize}px ui-monospace, monospace`;

  const lines: string[] = [];
  for (const rawLine of text.split("\n")) {
    if (rawLine.length === 0) {
      lines.push("");
      continue;
    }
    for (let i = 0; i < rawLine.length; i += RECEIPT_CHARS_PER_LINE) {
      lines.push(rawLine.slice(i, i + RECEIPT_CHARS_PER_LINE));
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = padding * 2 + lines.length * lineHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D není k dispozici.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000000";
  ctx.font = font;
  ctx.textBaseline = "top";

  lines.forEach((line, idx) => {
    ctx.fillText(line, padding, padding + idx * lineHeight);
  });

  return canvas;
}
