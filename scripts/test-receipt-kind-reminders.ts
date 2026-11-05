import { isReceiptKind, RECEIPT_KINDS } from "../lib/receipts/kind";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(RECEIPT_KINDS.includes("storno"), "storno kind");
assert(isReceiptKind("poukaz"), "poukaz kind");
assert(!isReceiptKind("foo"), "invalid kind");

// Storno účtenky nemají upomínky — logika v createStornoReceipt (remindersEnabled=false)
// a cron filtruje remindersEnabled: true.
console.log("OK: receipt kinds");
