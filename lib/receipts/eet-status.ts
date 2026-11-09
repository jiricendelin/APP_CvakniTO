/** Úprava běžné účtenky dokud není odeslaná do EET (R13). */
export function canModifyReceipt(r: {
  eetStatus: string;
  paidAt: Date | null;
  kind: string;
}): boolean {
  return (
    (r.eetStatus === "neodeslano" || r.eetStatus === "chyba") &&
    r.kind === "bezna"
  );
}

/** Smazání jen nezaplacená běžná účtenka s neodeslaným EET. */
export function canDeleteReceipt(r: {
  eetStatus: string;
  paidAt: Date | null;
  kind: string;
}): boolean {
  return canModifyReceipt(r) && r.paidAt === null;
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
