import { isValidIban, normalizeIban } from "@/lib/iban";

const ACCOUNT_WEIGHTS = [6, 3, 7, 9, 10, 5, 8, 4, 2, 1];
const PREFIX_WEIGHTS = [10, 5, 8, 4, 2, 1];

function mod11Check(digits: string, weights: number[]): boolean {
  const padded = digits.padStart(weights.length, "0");
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += parseInt(padded[i], 10) * weights[i];
  }
  return sum % 11 === 0;
}

/** Rozparsuje „předčíslí-číslo“ (bez kódu banky). */
export function parseAccountNumberPart(input: string): {
  prefix: string;
  account: string;
} {
  const cleaned = input.replace(/\s/g, "");
  if (cleaned.includes("-")) {
    const [prefix, account] = cleaned.split("-");
    return { prefix: prefix || "", account: account || "" };
  }
  return { prefix: "", account: cleaned };
}

/**
 * České číslo účtu ve tvaru `[předčíslí-]číslo/kód` (např. `2802120038/2010`
 * nebo `19-2000145399/0800`).
 */
export function parseBankAccount(
  input: string
): { prefix: string; account: string; bankCode: string } | null {
  const cleaned = input.replace(/\s/g, "");
  const slash = cleaned.lastIndexOf("/");
  if (slash < 0) return null;
  const numberPart = cleaned.slice(0, slash);
  const bankCode = cleaned.slice(slash + 1);
  if (!/^\d{4}$/.test(bankCode)) return null;
  const { prefix, account } = parseAccountNumberPart(numberPart);
  if (!account) return null;
  return { prefix, account, bankCode };
}

export function isValidCzechAccountNumber(
  account: string,
  prefix = ""
): boolean {
  if (!/^\d{1,10}$/.test(account)) return false;
  if (!mod11Check(account, ACCOUNT_WEIGHTS)) return false;
  if (prefix) {
    if (!/^\d{1,6}$/.test(prefix)) return false;
    if (!mod11Check(prefix, PREFIX_WEIGHTS)) return false;
  }
  return true;
}

function ibanCheckDigits(bban: string): string {
  const rearranged = `${bban}CZ00`;
  const numeric = rearranged.replace(/[A-Z]/g, (ch) =>
    String(ch.charCodeAt(0) - 55)
  );
  let remainder = 0;
  for (const digit of numeric) {
    remainder = (remainder * 10 + parseInt(digit, 10)) % 97;
  }
  return String(98 - remainder).padStart(2, "0");
}

export function accountToIban(
  bankCode: string,
  prefix: string,
  account: string
): string {
  const bban =
    bankCode.padStart(4, "0") +
    prefix.padStart(6, "0") +
    account.padStart(10, "0");
  return `CZ${ibanCheckDigits(bban)}${bban}`;
}

/**
 * Pro SPAYD: primárně IBAN z čísla účtu (cendelin.cz), fallback na uložený IBAN.
 * Pro CZK vyžaduje CZ IBAN.
 */
export function resolveIbanForSpayd(
  bankAccount: string | undefined,
  iban: string | undefined
): string | null {
  const parsed = bankAccount?.trim()
    ? parseBankAccount(bankAccount.trim())
    : null;
  if (
    parsed &&
    isValidCzechAccountNumber(parsed.account, parsed.prefix)
  ) {
    return accountToIban(parsed.bankCode, parsed.prefix, parsed.account);
  }

  const normalized = normalizeIban(iban ?? "");
  if (!normalized || !isValidIban(normalized)) return null;
  if (!normalized.startsWith("CZ")) return null;
  return normalized;
}
