export const VOUCHER_STATUSES = [
  "vystaveny",
  "zaplaceny",
  "vycerpany",
  "propadly",
] as const;

export type VoucherStatus = (typeof VOUCHER_STATUSES)[number];

export const VOUCHER_STATUS_LABELS: Record<VoucherStatus, string> = {
  vystaveny: "Vystavený",
  zaplaceny: "Zaplacený",
  vycerpany: "Vyčerpaný",
  propadly: "Propadlý",
};

export function isVoucherStatus(value: string): value is VoucherStatus {
  return (VOUCHER_STATUSES as readonly string[]).includes(value);
}

export const VOUCHER_KINDS = ["service", "value"] as const;
export type VoucherKind = (typeof VOUCHER_KINDS)[number];

export const VOUCHER_KIND_LABELS: Record<VoucherKind, string> = {
  service: "Konkrétní služba",
  value: "Hodnota",
};

export function isVoucherKind(value: string): value is VoucherKind {
  return (VOUCHER_KINDS as readonly string[]).includes(value);
}
