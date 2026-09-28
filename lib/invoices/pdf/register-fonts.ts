import path from "node:path";
import { Font } from "@react-pdf/renderer";

let registered = false;

export function registerInvoicePdfFonts(): void {
  if (registered) return;
  const regular = path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf");
  const bold = path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf");
  Font.register({
    family: "Roboto",
    fonts: [
      { src: regular, fontWeight: 400 },
      { src: bold, fontWeight: 700 },
    ],
  });
  registered = true;
}
