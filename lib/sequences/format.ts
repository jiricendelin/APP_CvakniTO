import { pragueYear } from "@/lib/time/prague";

const FORMAT_TOKEN = /\{(N+)\}/;

/** Formát musí obsahovat {N…} pro pořadové číslo (např. {NNNN}). */
export function isValidSequenceFormat(format: string): boolean {
  return FORMAT_TOKEN.test(format);
}

export function formatSequenceNumber(
  prefix: string,
  format: string,
  value: number,
  year: number = pragueYear()
): string {
  let body = format;
  body = body.replace(/\{YYYY\}/g, String(year));
  body = body.replace(/\{YY\}/g, String(year).slice(-2));
  body = body.replace(/\{(N+)\}/g, (_match, run: string) =>
    String(value).padStart(run.length, "0")
  );
  return `${prefix}${body}`;
}

/** Náhled dalšího čísla bez spotřebování řady. */
export function previewNextSequenceNumber(
  prefix: string,
  format: string,
  nextValue: number,
  resetYearly: boolean,
  storedYear: number | null
): string {
  const year = pragueYear();
  let value = nextValue;
  if (resetYearly && storedYear !== null && storedYear !== year) {
    value = 1;
  }
  return formatSequenceNumber(prefix, format, value, year);
}
