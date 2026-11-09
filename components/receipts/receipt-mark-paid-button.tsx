"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  markReceiptPaidAction,
  type ReceiptActionState,
} from "@/app/(app)/receipts/actions";
import { CsrfField } from "@/components/csrf-field";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-60"
    >
      {pending ? "…" : "Označit jako uhrazeno (ručně)"}
    </button>
  );
}

export function ReceiptMarkPaidButton({
  csrf,
  receiptId,
}: {
  csrf: string;
  receiptId: string;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<
    ReceiptActionState,
    FormData
  >(markReceiptPaidAction, {});

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-2">
      <CsrfField token={csrf} />
      <input type="hidden" name="receiptId" value={receiptId} />
      <p className="text-xs text-muted-foreground">
        Bez párování platby z banky — jen stav uhrazeno na účtence.
      </p>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
