import { formatCzk } from "@/lib/money";

export function registerReceiptTemplateHelpers(Handlebars: {
  registerHelper: (name: string, fn: (...args: unknown[]) => unknown) => void;
}): void {
  Handlebars.registerHelper("formatCzk", (cents: unknown) => {
    if (typeof cents !== "number" || !Number.isFinite(cents)) return "";
    return formatCzk(cents);
  });
}
