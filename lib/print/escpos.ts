import { encodeCp852 } from "./cp852";

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

export function escposInit(): Uint8Array {
  return new Uint8Array([0x1b, 0x40]);
}

/** ESC t n — výběr code page (číslo z autotestu tiskárny, často 18 = CP852). */
export function escposSelectCodePage(codePage: number): Uint8Array {
  return new Uint8Array([0x1b, 0x74, codePage & 0xff]);
}

export function escposTextCp852(text: string): Uint8Array {
  return encodeCp852(text);
}

export function escposFeed(lines = 3): Uint8Array {
  return new Uint8Array([0x1b, 0x64, lines & 0xff]);
}

/** GS ( k — nativní QR (model 2). */
export function escposQrNative(data: string, moduleSize = 4): Uint8Array {
  const payload = new TextEncoder().encode(data);
  const chunks: number[] = [
    0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00,
    0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, moduleSize & 0xff,
    0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31,
  ];

  const storeLen = payload.length + 3;
  chunks.push(
    0x1d,
    0x28,
    0x6b,
    storeLen & 0xff,
    (storeLen >> 8) & 0xff,
    0x31,
    0x50,
    0x30,
    ...payload
  );
  chunks.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
  return new Uint8Array(chunks);
}

/** GS v 0 — rastr (1 bit na pixel, MSB vlevo). */
export function escposRaster(bitmap: Uint8Array, widthPx: number, heightPx: number): Uint8Array {
  const bytesPerRow = (widthPx + 7) >> 3;
  const xL = bytesPerRow & 0xff;
  const xH = (bytesPerRow >> 8) & 0xff;
  const yL = heightPx & 0xff;
  const yH = (heightPx >> 8) & 0xff;
  const header = new Uint8Array([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
  return concatBytes(header, bitmap);
}

export function bitmapFromCanvas(canvas: HTMLCanvasElement): {
  bitmap: Uint8Array;
  width: number;
  height: number;
} {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D není k dispozici.");

  const img = ctx.getImageData(0, 0, width, height);
  const bytesPerRow = (width + 7) >> 3;
  const bitmap = new Uint8Array(bytesPerRow * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const lum =
        img.data[i]! * 0.299 +
        img.data[i + 1]! * 0.587 +
        img.data[i + 2]! * 0.114;
      if (lum < 168) {
        const idx = y * bytesPerRow + (x >> 3);
        bitmap[idx] = (bitmap[idx] ?? 0) | (0x80 >> (x & 7));
      }
    }
  }

  return { bitmap, width, height };
}

export function renderTextToCanvas(
  text: string,
  widthPx: number,
  fontSize = 28
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D není k dispozici.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, widthPx, 4);
  ctx.fillStyle = "#000000";
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  ctx.textBaseline = "top";

  const padding = 8;
  const maxWidth = widthPx - padding * 2;
  const lines: string[] = [];
  const words = text.split(/\s+/);
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const lineHeight = Math.ceil(fontSize * 1.25);
  canvas.height = padding * 2 + lines.length * lineHeight;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000000";
  ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  ctx.textBaseline = "top";
  lines.forEach((ln, idx) => {
    ctx.fillText(ln, padding, padding + idx * lineHeight);
  });

  return canvas;
}
