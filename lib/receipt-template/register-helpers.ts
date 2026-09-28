import type { Runtime } from "handlebars";
import { formatCzk } from "@/lib/money";

export function registerReceiptTemplateHelpers(
  Handlebars: Pick<Runtime, "registerHelper">
): void {
  Handlebars.registerHelper("formatCzk", (cents: unknown) => {
    if (typeof cents !== "number" || !Number.isFinite(cents)) return "";
    return formatCzk(cents);
  });
}
