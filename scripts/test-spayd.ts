import assert from "node:assert/strict";
import { buildSpaydPayment } from "../lib/spayd";

/** Ručně spočítaný vzor (IBAN + 480,50 Kč + VS dle SPAYD 1.0). */
const EXPECTED =
  "SPD*1.0*ACC:CZ5855000000001265098001*AM:480.50*CC:CZK*X-VS:1234567890*MSG:Uctenka 20250042";

const actual = buildSpaydPayment({
  iban: "CZ58 5500 0000 0012 6509 8001",
  amountCents: 48_050,
  variableSymbol: "1234567890",
  message: "Uctenka 20250042",
});

assert.equal(actual, EXPECTED, "SPAYD řetězec nesedí s očekávaným vzorem.");
console.log("test-spayd: OK");
