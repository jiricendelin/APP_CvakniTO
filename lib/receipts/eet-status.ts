/** Úprava / smazání jen dokud není odesláno do EET (R13). */
export function canModifyReceipt(eetStatus: string): boolean {
  return eetStatus === "neodeslano";
}
