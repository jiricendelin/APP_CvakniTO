import assert from "node:assert/strict";
import { accountToIban } from "../lib/czech-account";
import { buildSpaydPayment } from "../lib/spayd";

/** Ručně spočítaný vzor (IBAN + 480,50 Kč + VS dle SPAYD 1.0) — bez RN. */
const EXPECTED =
  "SPD*1.0*ACC:CZ5855000000001265098001*AM:480.50*CC:CZK*X-VS:1234567890*MSG:Uctenka 20250042";

const actual = buildSpaydPayment({
  iban: "CZ58 5500 0000 0012 6509 8001",
  amountCents: 48_050,
  variableSymbol: "1234567890",
  message: "Uctenka 20250042",
});

assert.equal(actual, EXPECTED, "SPAYD řetězec nesedí s očekávaným vzorem.");

const fromAccount = buildSpaydPayment({
  bankAccount: "1265098001/5500",
  amountCents: 48_050,
  variableSymbol: "1234567890",
  message: "Uctenka 20250042",
});
assert.equal(
  fromAccount,
  EXPECTED,
  "SPAYD z čísla účtu musí dát stejný IBAN jako ruční vstup."
);

const derived = accountToIban("2010", "", "2802120038");
const fromEvaAccount = buildSpaydPayment({
  bankAccount: "2802120038/2010",
  iban: "CZ6020102802120000000038",
  amountCents: 500,
  variableSymbol: "260014",
  message: "Uctenka U260014",
});
assert.equal(
  fromEvaAccount,
  `SPD*1.0*ACC:${derived}*AM:5.00*CC:CZK*X-VS:260014*MSG:Uctenka U260014`,
  "bankAccount má přednost před chybným IBAN; bez RN."
);

assert.equal(
  buildSpaydPayment({
    iban: "DE89370400440532013000",
    amountCents: 100,
    variableSymbol: "1",
  }),
  null,
  "Ne-CZ IBAN se pro CZK SPAYD odmítne."
);

console.log("test-spayd: OK");
