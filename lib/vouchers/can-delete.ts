/** Nezaplacený poukaz bez EET / plateb — vhodné i pro úklid testů. */
export function canDeleteVoucher(v: {
  status: string;
  receipt: {
    paidAt: Date | string | null;
    eetStatus: string;
    paymentsCount?: number;
  } | null;
}): boolean {
  if (v.status === "zaplaceny" || v.status === "vycerpany") return false;
  if (!v.receipt) return true;
  if (v.receipt.paidAt) return false;
  if (
    v.receipt.eetStatus !== "neodeslano" &&
    v.receipt.eetStatus !== "chyba"
  ) {
    return false;
  }
  if ((v.receipt.paymentsCount ?? 0) > 0) return false;
  return true;
}
