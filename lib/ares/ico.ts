/** IČO — 8 číslic (doplnění nul vlevo). */
export function normalizeIco(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return digits.padStart(8, "0").slice(-8);
}

export function isValidIcoFormat(ico: string): boolean {
  const n = normalizeIco(ico);
  return n.length === 8 && /^\d{8}$/.test(n);
}
