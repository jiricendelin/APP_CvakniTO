import type { TenantSettings } from "@/lib/settings/schema";
import { buildSpaydForReceipt } from "@/lib/spayd";
import type { ReceiptTemplateContext } from "./types";

/** Ukázková data pro náhled šablony v nastavení. */
export function buildSampleReceiptContext(
  settings: Pick<
    TenantSettings,
    | "companyName"
    | "companyIco"
    | "companyDic"
    | "companyAddress"
    | "bankAccount"
    | "iban"
  >
): ReceiptTemplateContext {
  const number = "2025-0042";
  const variableSymbol = "20250042";
  const totalCents = 150_000;

  const qrSpayd = buildSpaydForReceipt({
    iban: settings.iban,
    totalCents,
    variableSymbol,
    receiptNumber: number,
    companyName: settings.companyName,
  });

  return {
    companyName: settings.companyName || "Ukázková firma s.r.o.",
    companyIco: settings.companyIco || "12345678",
    companyDic: settings.companyDic || "CZ12345678",
    companyAddress:
      settings.companyAddress || "Hlavní 1, 110 00 Praha",
    bankAccount: settings.bankAccount || "2802120038/2010",
    iban: settings.iban || "CZ5855000000001265098001",
    number,
    variableSymbol,
    datetime: "28. 9. 2025 14:30",
    paymentLabel: "QR platba",
    paymentType: "qr",
    totalCents,
    items: [
      {
        name: "Masáž 60 min",
        quantity: 1,
        priceCents: 80_000,
        lineTotalCents: 80_000,
        category: "masaze",
      },
      {
        name: "Pedikúra",
        quantity: 1,
        priceCents: 70_000,
        lineTotalCents: 70_000,
        category: "pedikura",
      },
    ],
    qrSpayd,
    eetStatusLabel: "Neodesláno do EET",
    eetFik: null,
    eetBkp: null,
  };
}
