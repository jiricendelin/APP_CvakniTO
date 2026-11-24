/** Název PDF jako ve WTime: `Faktura {číslo} - {odběratel}.pdf` */
export function invoicePdfFilename(
  invoiceNumber: string,
  customerName: string
): string {
  const name = customerName.trim() || "odberatel";
  return `Faktura ${invoiceNumber} - ${name}.pdf`;
}
