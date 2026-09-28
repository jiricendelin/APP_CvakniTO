import assert from "node:assert/strict";
import { DEFAULT_RECEIPT_TEMPLATE } from "../lib/receipt-template/default-template";
import { validateReceiptTemplate } from "../lib/receipt-template/render";

const result = validateReceiptTemplate(DEFAULT_RECEIPT_TEMPLATE, {
  companyName: "Test",
  companyIco: "12345678",
  companyDic: "CZ12345678",
  companyAddress: "Praha",
  bankAccount: "",
  iban: "CZ5855000000001265098001",
});

assert.equal(result.ok, true, result.ok ? "" : result.error);
assert.ok(result.ok && result.text.includes("CELKEM"));
console.log("test-receipt-template: OK");
