/** Úprava / smazání jen dokud není odesláno do EET (R13). */
export function canModifyReceipt(eetStatus: string): boolean {
  return eetStatus === "neodeslano" || eetStatus === "chyba";
}

export function canSendReceiptToEet(eetStatus: string): boolean {
  return eetStatus === "neodeslano" || eetStatus === "chyba";
}

export function canStornoReceiptInEet(eetStatus: string): boolean {
  return eetStatus === "odeslano";
}

export function eetStatusLabel(status: string): string {
  switch (status) {
    case "neodeslano":
      return "Neodesláno do EET";
    case "odeslano":
      return "Odesláno do EET";
    case "chyba":
      return "Chyba odeslání EET";
    case "stornovano":
      return "Stornováno v EET";
    default:
      return status;
  }
}
