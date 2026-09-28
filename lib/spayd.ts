import { isValidIban, normalizeIban } from "@/lib/iban";

export type SpaydPaymentInput = {
  iban: string;
  amountCents: number;
  variableSymbol: string;
  message?: string;
  recipientName?: string;
};

const MSG_MAX = 60;
const RN_MAX = 35;

/** Percent-encoding pro hodnoty dle SPAYD (hvězdička a procento). */
function escapeSpaydValue(value: string): string {
  let out = "";
  for (const ch of value) {
    if (ch === "*") out += "%2A";
    else if (ch === "%") out += "%25";
    else if (ch >= " " && ch <= "~") out += ch;
    else out += encodeURIComponent(ch);
  }
  return out;
}

/** Zpráva bez diakritiky — spolehlivější pro bankovní aplikace. */
export function spaydAsciiMessage(text: string, maxLen: number): string {
  const folded = text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return folded.slice(0, maxLen);
}

export function formatSpaydAmount(amountCents: number): string {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new Error("SPAYD: neplatná částka.");
  }
  const major = Math.floor(amountCents / 100);
  const minor = amountCents % 100;
  const am = `${major}.${minor.toString().padStart(2, "0")}`;
  if (am.length > 10) {
    throw new Error("SPAYD: částka je příliš velká.");
  }
  return am;
}

export function buildSpaydPayment(input: SpaydPaymentInput): string | null {
  const iban = normalizeIban(input.iban);
  if (!iban || !isValidIban(iban)) return null;

  const vs = String(input.variableSymbol).replace(/\D/g, "");
  if (!vs) return null;

  const am = formatSpaydAmount(input.amountCents);

  const parts = [
    "SPD*1.0",
    `ACC:${escapeSpaydValue(iban)}`,
    `AM:${am}`,
    "CC:CZK",
    `X-VS:${escapeSpaydValue(vs)}`,
  ];

  const msg = spaydAsciiMessage(
    input.message ?? `Uctenka ${vs}`,
    MSG_MAX
  );
  if (msg) parts.push(`MSG:${escapeSpaydValue(msg)}`);

  const rn = input.recipientName
    ? spaydAsciiMessage(input.recipientName, RN_MAX).toUpperCase()
    : "";
  if (rn) parts.push(`RN:${escapeSpaydValue(rn)}`);

  return parts.join("*");
}

export function buildSpaydForReceipt(params: {
  iban: string;
  totalCents: number;
  variableSymbol: string;
  receiptNumber: string;
  companyName?: string;
}): string | null {
  return buildSpaydPayment({
    iban: params.iban,
    amountCents: params.totalCents,
    variableSymbol: params.variableSymbol,
    message: `Uctenka ${params.receiptNumber.trim()}`,
    recipientName: params.companyName,
  });
}
