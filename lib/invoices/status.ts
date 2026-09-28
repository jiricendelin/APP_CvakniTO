export const INVOICE_STATUSES = [
  "koncept",
  "odeslana",
  "zaplacena",
  "po_splatnosti",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  koncept: "Koncept",
  odeslana: "Odeslaná",
  zaplacena: "Zaplacená",
  po_splatnosti: "Po splatnosti",
};

export function isInvoiceStatus(value: string): value is InvoiceStatus {
  return (INVOICE_STATUSES as readonly string[]).includes(value);
}

/** `po_splatnosti` se dopočítá z data splatnosti, pokud není zaplaceno. */
export function resolveInvoiceStatus(
  storedStatus: string,
  dueDate: Date,
  now = new Date()
): InvoiceStatus {
  if (storedStatus === "zaplacena") return "zaplacena";
  if (storedStatus === "odeslana" || storedStatus === "koncept") {
    const due = new Date(dueDate);
    due.setHours(23, 59, 59, 999);
    if (now > due && storedStatus !== "koncept") {
      return "po_splatnosti";
    }
    if (storedStatus === "odeslana") return "odeslana";
    return "koncept";
  }
  if (isInvoiceStatus(storedStatus)) return storedStatus;
  return "koncept";
}
