import { pragueStartOfDayUtc } from "@/lib/time/prague";

/** Výchozí splatnost: dnes (Praha) + 14 dní jako YYYY-MM-DD. */
export function defaultInvoiceDueDateYmd(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  const y = get("year");
  const m = get("month");
  const d = get("day");
  const base = new Date(Date.UTC(y, m - 1, d + 14));
  const ny = base.getUTCFullYear();
  const nmo = base.getUTCMonth() + 1;
  const nd = base.getUTCDate();
  const ymd = `${ny}-${String(nmo).padStart(2, "0")}-${String(nd).padStart(2, "0")}`;
  if (pragueStartOfDayUtc(ymd)) return ymd;
  return ymd;
}
