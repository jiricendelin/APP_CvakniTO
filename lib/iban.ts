export function normalizeIban(iban: string): string {
  return iban.replace(/\s+/g, "").toUpperCase();
}

/** Mod-97 (ISO 13616). Prázdný řetězec = neplatí se (volitelné pole). */
export function isValidIban(iban: string): boolean {
  const normalized = normalizeIban(iban);
  if (!normalized) return true;
  if (normalized.length < 15 || normalized.length > 34) return false;
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(normalized)) return false;

  const rearranged = normalized.slice(4) + normalized.slice(0, 4);
  let digits = "";
  for (const ch of rearranged) {
    if (ch >= "A" && ch <= "Z") {
      digits += (ch.charCodeAt(0) - 55).toString();
    } else {
      digits += ch;
    }
  }

  let remainder = 0;
  for (let i = 0; i < digits.length; i += 7) {
    const block = String(remainder) + digits.slice(i, i + 7);
    remainder = parseInt(block, 10) % 97;
  }
  return remainder === 1;
}
