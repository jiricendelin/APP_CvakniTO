import { formatPragueIsoDateTime } from "@/lib/time/prague";

/** CastkaType: dvě desetinná místa, tečka. */
export function centsToEetAmount(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  return `${sign}${whole}.${frac.toString().padStart(2, "0")}`;
}

/** ISO 8601 s offsetem pro Europe/Prague. */
export function dateToEetDateTime(date: Date): string {
  return formatPragueIsoDateTime(date);
}

/** Zkrátí / sanitizuje číslo účtenky pro porad_cis (max 25 znaků EET). */
export function receiptNumberToPoradCis(number: string): string {
  const trimmed = number.trim().slice(0, 25);
  if (/^[0-9a-zA-Z.,:;/#\-_ ]{1,25}$/.test(trimmed)) return trimmed;
  const safe = trimmed.replace(/[^0-9a-zA-Z.,:;/#\-_ ]/g, "_").slice(0, 25);
  return safe.length > 0 ? safe : "1";
}
