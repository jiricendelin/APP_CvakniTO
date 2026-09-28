export type ReceiptTemplateVariable = {
  name: string;
  description: string;
};

export const RECEIPT_TEMPLATE_VARIABLES: ReceiptTemplateVariable[] = [
  { name: "companyName", description: "Název firmy" },
  { name: "companyAddress", description: "Adresa firmy" },
  { name: "companyIco", description: "IČO" },
  { name: "companyDic", description: "DIČ" },
  { name: "bankAccount", description: "Číslo účtu (text z nastavení)" },
  { name: "iban", description: "IBAN" },
  { name: "number", description: "Číslo účtenky" },
  { name: "variableSymbol", description: "Variabilní symbol" },
  { name: "datetime", description: "Datum a čas vystavení (Praha)" },
  { name: "paymentLabel", description: "Popisek platby (Hotově / QR platba)" },
  { name: "paymentType", description: "Kód platby (hotove / qr)" },
  { name: "totalCents", description: "Celkem v haléřích — použijte {{formatCzk totalCents}}" },
  { name: "items", description: "Položky — smyčka {{#each items}}…{{/each}}" },
  { name: "name", description: "Název položky (uvnitř each)" },
  { name: "quantity", description: "Množství (uvnitř each)" },
  { name: "lineTotalCents", description: "Řádek celkem v haléřích (uvnitř each)" },
  { name: "qrSpayd", description: "SPAYD řetězec pro QR (prázdné u hotovosti)" },
  { name: "eetStatusLabel", description: "Stav EET (text)" },
  { name: "eetFik", description: "FIK z EET (až po odeslání)" },
  { name: "eetBkp", description: "BKP z EET (až po odeslání)" },
];

export const RECEIPT_TEMPLATE_HELPERS = [
  {
    name: "formatCzk",
    description: "Formát částky v Kč, např. {{formatCzk totalCents}}",
  },
];
