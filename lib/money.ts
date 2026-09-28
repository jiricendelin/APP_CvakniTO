const czkFormatter = new Intl.NumberFormat("cs-CZ", {
  style: "currency",
  currency: "CZK",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Haléře → „800,00 Kč“ */
export function formatCzk(haler: number): string {
  return czkFormatter.format(haler / 100);
}

/** „800“, „800,50“, „1 750,00“ → haléře; neplatné → null */
export function parseCzkInput(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, "");
  if (!trimmed) return null;
  const normalized = trimmed.replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const parts = normalized.split(".");
  const whole = parseInt(parts[0]!, 10);
  const frac = parts[1] ? parts[1].padEnd(2, "0").slice(0, 2) : "00";
  if (!Number.isFinite(whole)) return null;
  return whole * 100 + parseInt(frac, 10);
}
