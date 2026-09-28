/** VS = číselná podoba čísla účtenky (jen číslice). */
export function receiptNumberToVariableSymbol(number: string): string {
  const digits = number.replace(/\D/g, "");
  if (!digits) {
    throw new Error("Číslo účtenky neobsahuje číslice pro variabilní symbol.");
  }
  return digits;
}
