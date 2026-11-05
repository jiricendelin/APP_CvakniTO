export const RECEIPT_KINDS = ["bezna", "poukaz", "storno"] as const;
export type ReceiptKind = (typeof RECEIPT_KINDS)[number];

export const RECEIPT_KIND_LABELS: Record<ReceiptKind, string> = {
  bezna: "Běžná",
  poukaz: "Dárkový poukaz",
  storno: "Storno poplatek",
};

export function isReceiptKind(value: string): value is ReceiptKind {
  return (RECEIPT_KINDS as readonly string[]).includes(value);
}
