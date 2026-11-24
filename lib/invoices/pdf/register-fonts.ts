import fs from "node:fs";
import path from "node:path";
import { Font } from "@react-pdf/renderer";

let registered = false;

function arimoPath(filename: string): string {
  const resolved = path.join(process.cwd(), "lib/invoices/fonts", filename);
  if (!fs.existsSync(resolved)) {
    throw new Error(
      `Chybí font ${filename} (${resolved}). Zkontrolujte deploy — složka lib/invoices/fonts musí být v image.`
    );
  }
  return resolved;
}

export function registerInvoicePdfFonts(): void {
  if (registered) return;
  registered = true;

  Font.register({
    family: "Arimo",
    fonts: [
      { src: arimoPath("Arimo-Regular.ttf"), fontWeight: 400 },
      { src: arimoPath("Arimo-SemiBold.ttf"), fontWeight: 600 },
      { src: arimoPath("Arimo-Bold.ttf"), fontWeight: 700 },
    ],
  });

  const regular = path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf");
  const bold = path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf");
  Font.register({
    family: "Roboto",
    fonts: [
      { src: regular, fontWeight: 400 },
      { src: bold, fontWeight: 700 },
    ],
  });

  Font.registerHyphenationCallback((word) => [word]);
}
