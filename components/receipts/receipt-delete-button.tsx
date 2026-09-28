"use client";

import { CsrfField } from "@/components/csrf-field";
import { deleteReceiptAction } from "@/app/(app)/receipts/actions";

export function ReceiptDeleteButton({
  csrf,
  receiptId,
}: {
  csrf: string;
  receiptId: string;
}) {
  return (
    <form
      action={deleteReceiptAction}
      onSubmit={(e) => {
        if (
          !window.confirm(
            "Opravdu smazat tuto účtenku? Tuto akci nelze vrátit."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <CsrfField token={csrf} />
      <input type="hidden" name="receiptId" value={receiptId} />
      <button
        type="submit"
        className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 sm:w-auto"
      >
        Smazat účtenku
      </button>
    </form>
  );
}
