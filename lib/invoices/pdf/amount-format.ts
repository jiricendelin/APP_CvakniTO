/** Formátování částek na PDF faktuře (styl WTime), vstup v haléřích. */

function groupThousands(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatCzkWhole(n: number): string {
  const int = Math.round(n);
  return `${groupThousands(String(int))},- Kč`;
}

function formatCzkWithDecimals(n: number): string {
  const fixed = (Math.round(n * 100) / 100).toFixed(2);
  const [intPart, dec] = fixed.split(".");
  return `${groupThousands(intPart!)},${dec} Kč`;
}

export type InvoiceAmountRole = "line" | "total";

/** Haléře → text částky; total zaokrouhlí nahoru na celé koruny. */
export function formatInvoiceAmountFromCents(
  cents: number,
  role: InvoiceAmountRole = "line"
): string {
  const n = cents / 100;
  if (role === "total") {
    return formatCzkWhole(Math.ceil(n));
  }
  const rounded = Math.round(n * 100) / 100;
  if (Math.abs(rounded - Math.round(rounded)) < 0.001) {
    return formatCzkWhole(rounded);
  }
  return formatCzkWithDecimals(rounded);
}

export function formatInvoiceTotalFromCents(totalCents: number): string {
  return formatInvoiceAmountFromCents(totalCents, "total");
}
