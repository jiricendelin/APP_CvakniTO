export const SEQUENCE_KINDS = ["receipt", "invoice"] as const;

export type SequenceKind = (typeof SEQUENCE_KINDS)[number];

export const SEQUENCE_KIND_LABELS: Record<SequenceKind, string> = {
  receipt: "Účtenky",
  invoice: "Faktury",
};

export function isSequenceKind(value: string): value is SequenceKind {
  return (SEQUENCE_KINDS as readonly string[]).includes(value);
}
