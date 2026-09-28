export const PAYMENT_TYPES = ["hotove", "qr"] as const;

export type PaymentType = (typeof PAYMENT_TYPES)[number];

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  hotove: "Hotově",
  qr: "QR platba",
};

export function isPaymentType(value: string): value is PaymentType {
  return (PAYMENT_TYPES as readonly string[]).includes(value);
}
