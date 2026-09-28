import {
  PRICE_CATEGORIES,
  PRICE_CATEGORY_LABELS,
  type PriceCategory,
} from "@/lib/pricelist/categories";
import type { ReportSummary } from "./aggregate";

function formatCzkCsv(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function reportSummaryToCsv(summary: ReportSummary): string {
  const lines: string[] = [];
  lines.push("Zdroj;Kategorie;Castka_CZK");

  for (const cat of PRICE_CATEGORIES) {
    lines.push(
      `Uctenky;${PRICE_CATEGORY_LABELS[cat]};${formatCzkCsv(summary.receiptTotals[cat])}`
    );
  }
  for (const cat of PRICE_CATEGORIES) {
    lines.push(
      `Faktury;${PRICE_CATEGORY_LABELS[cat]};${formatCzkCsv(summary.invoiceTotals[cat])}`
    );
  }
  lines.push(`Celkem;;${formatCzkCsv(summary.grandTotalCents)}`);

  const body = lines.join("\r\n");
  return `\uFEFF${body}`;
}
