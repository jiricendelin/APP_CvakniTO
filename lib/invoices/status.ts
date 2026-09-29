export const INVOICE_STATUSES = [
  "koncept",
  "vystavena",
  "zaplacena",
  "stornovana",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  koncept: "Koncept",
  vystavena: "Vystavená",
  zaplacena: "Zaplacená",
  stornovana: "Stornovaná",
};

export type StatusVariant =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "destructive"
  | "muted"
  | "outline";

export const INVOICE_STATUS_VARIANTS: Record<InvoiceStatus, StatusVariant> = {
  koncept: "outline",
  vystavena: "secondary",
  zaplacena: "success",
  stornovana: "muted",
};

export function isInvoiceStatus(value: string): value is InvoiceStatus {
  return (INVOICE_STATUSES as readonly string[]).includes(value);
}

export function isKonceptNumber(number: string): boolean {
  return number.startsWith("KONCEPT-");
}

/** Vizuální stav navíc: vystavená a nezaplacená faktura po termínu splatnosti. */
export function isOverdue(
  status: string,
  dueDate: Date,
  now: Date = new Date()
): boolean {
  if (status !== "vystavena") return false;
  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);
  return now > due;
}

export type ResolvedInvoiceStatus = InvoiceStatus | "po_splatnosti";

export const RESOLVED_STATUS_LABELS: Record<ResolvedInvoiceStatus, string> = {
  ...INVOICE_STATUS_LABELS,
  po_splatnosti: "Po splatnosti",
};

export const RESOLVED_STATUS_VARIANTS: Record<ResolvedInvoiceStatus, StatusVariant> =
  {
    ...INVOICE_STATUS_VARIANTS,
    po_splatnosti: "destructive",
  };

/** `po_splatnosti` je jen odvozený zobrazovaný stav, neukládá se. */
export function resolveInvoiceStatus(
  storedStatus: string,
  dueDate: Date,
  now: Date = new Date()
): ResolvedInvoiceStatus {
  if (storedStatus === "vystavena" && isOverdue(storedStatus, dueDate, now)) {
    return "po_splatnosti";
  }
  if (isInvoiceStatus(storedStatus)) return storedStatus;
  return "koncept";
}
