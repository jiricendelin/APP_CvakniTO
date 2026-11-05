import { formatVoucherNumber } from "../lib/vouchers/sequence";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(formatVoucherNumber(11, 2026, 52) === "1126052", "start 052");
assert(formatVoucherNumber(11, 2026, 1) === "1126001", "after overflow 001");
assert(formatVoucherNumber(12, 2026, 999) === "1226999", "max 999");
assert(formatVoucherNumber(1, 2000, 52) === "0100052", "year 00");

console.log("OK: voucher sequence formatting");
