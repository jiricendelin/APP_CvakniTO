/** Kalendářní části data v Europe/Prague (bez minut). */
export function pragueParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Prague",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
  };
}

/** Přidej měsíce k datu (kalendářní den Europe/Prague → Date jako UTC midnight date). */
export function addMonthsPrague(from: Date, months: number): Date {
  const p = pragueParts(from);
  let y = p.year;
  let m = p.month + months;
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const d = Math.min(p.day, lastDay);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatPragueDateCz(date: Date): string {
  const p = pragueParts(date);
  return `${String(p.day).padStart(2, "0")}.${String(p.month).padStart(2, "0")}.${p.year}`;
}
