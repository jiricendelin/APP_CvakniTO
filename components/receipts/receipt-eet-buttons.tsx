"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createCorrectionReceiptAction,
  sendReceiptToEetAction,
  stornoReceiptInEetAction,
  type ReceiptEetActionState,
} from "@/app/(app)/receipts/eet-actions";
import { CsrfField } from "@/components/csrf-field";
import {
  canSendReceiptToEet,
  canStornoReceiptInEet,
} from "@/lib/receipts/eet-status";

export function ReceiptEetButtons({
  csrf,
  receiptId,
  eetStatus,
}: {
  csrf: string;
  receiptId: string;
  eetStatus: string;
}) {
  const router = useRouter();
  const [sendState, sendAction] = useActionState<
    ReceiptEetActionState,
    FormData
  >(sendReceiptToEetAction, {});
  const [stornoState, stornoAction] = useActionState<
    ReceiptEetActionState,
    FormData
  >(stornoReceiptInEetAction, {});
  const [corrState, corrAction] = useActionState<
    ReceiptEetActionState,
    FormData
  >(createCorrectionReceiptAction, {});

  const errorMsg =
    sendState.error || stornoState.error || corrState.error;
  const successMsg =
    sendState.success || stornoState.success || corrState.success;

  useEffect(() => {
    if (corrState.redirectReceiptId) {
      router.push(`/receipts/${corrState.redirectReceiptId}`);
    } else if (sendState.success || stornoState.success || corrState.success) {
      router.refresh();
    }
  }, [
    corrState.redirectReceiptId,
    corrState.success,
    sendState.success,
    stornoState.success,
    router,
  ]);

  const showSend = canSendReceiptToEet(eetStatus);
  const showStorno = canStornoReceiptInEet(eetStatus);
  const showCorrection = eetStatus === "stornovano";

  if (!showSend && !showStorno && !showCorrection && !errorMsg && !successMsg) {
    return null;
  }

  return (
    <section className="space-y-2 rounded-lg border border-border p-4">
      <h2 className="text-sm font-medium">EET</h2>
      {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}
      {successMsg && !errorMsg && (
        <p className="text-sm text-green-700 dark:text-green-400">{successMsg}</p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {showSend && (
          <form action={sendAction}>
            <CsrfField token={csrf} />
            <input type="hidden" name="receiptId" value={receiptId} />
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Odeslat do EET
            </button>
          </form>
        )}
        {showStorno && (
          <form action={stornoAction}>
            <CsrfField token={csrf} />
            <input type="hidden" name="receiptId" value={receiptId} />
            <button
              type="submit"
              className="rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
            >
              Stornovat v EET
            </button>
          </form>
        )}
        {showCorrection && (
          <form action={corrAction}>
            <CsrfField token={csrf} />
            <input type="hidden" name="receiptId" value={receiptId} />
            <button
              type="submit"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              Vystavit opravnou účtenku
            </button>
          </form>
        )}
      </div>
      {eetStatus === "odeslano" && (
        <p className="text-xs text-muted-foreground">
          Úpravu lze provést jen po stornu v EET a vystavení opravné účtenky.
        </p>
      )}
    </section>
  );
}
