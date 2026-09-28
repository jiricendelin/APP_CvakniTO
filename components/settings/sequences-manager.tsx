"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  updateSequenceAction,
  type SequenceActionState,
} from "@/app/(app)/settings/sequences/actions";
import { CsrfField } from "@/components/csrf-field";
import {
  SEQUENCE_KIND_LABELS,
  type SequenceKind,
} from "@/lib/sequences/kinds";

export type SequenceRow = {
  kind: SequenceKind;
  prefix: string;
  format: string;
  resetYearly: boolean;
  preview: string;
  nextValue: number;
};

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      {pending ? "Ukládám…" : "Uložit řadu"}
    </button>
  );
}

function SequenceForm({
  csrf,
  row,
}: {
  csrf: string;
  row: SequenceRow;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<
    SequenceActionState,
    FormData
  >(updateSequenceAction, {});

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-lg border border-border p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">
          {SEQUENCE_KIND_LABELS[row.kind]}
        </h2>
        <p className="text-xs text-muted-foreground">
          Další číslo:{" "}
          <span className="font-mono font-medium text-foreground">
            {row.preview}
          </span>
        </p>
      </div>
      <CsrfField token={csrf} />
      <input type="hidden" name="kind" value={row.kind} />
      <label className="block text-xs">
        Prefix
        <input
          name="prefix"
          defaultValue={row.prefix}
          className={`${fieldClass} mt-1`}
          placeholder="např. F"
        />
      </label>
      <label className="block text-xs">
        Formát
        <input
          name="format"
          defaultValue={row.format}
          required
          className={`${fieldClass} mt-1 font-mono`}
          placeholder="{YYYY}{NNNN}"
        />
      </label>
      <p className="text-xs text-muted-foreground">
        Placeholder: {"{YYYY}"}, {"{YY}"}, {"{NNNN}"} (libovolný počet N). Aktuální
        pořadí v DB: {row.nextValue}.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="resetYearly"
          defaultChecked={row.resetYearly}
          className="h-4 w-4 rounded border-input"
        />
        Resetovat na 1 každý rok (Europe/Prague)
      </label>
      {state.error && (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-primary" role="status">
          Řada uložena.
        </p>
      )}
      <SubmitButton />
    </form>
  );
}

export function SequencesManager({
  csrf,
  rows,
}: {
  csrf: string;
  rows: SequenceRow[];
}) {
  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="space-y-2">
        <Link
          href="/settings"
          className="text-sm text-primary hover:underline"
        >
          ← Nastavení
        </Link>
        <h1 className="text-xl font-semibold">Číselné řady</h1>
        <p className="text-sm text-muted-foreground">
          Formát čísla účtenky a faktury. Přidělení probíhá atomicky při
          vystavení (R11 / faktury).
        </p>
      </div>

      <div className="space-y-4">
        {rows.map((row) => (
          <SequenceForm key={row.kind} csrf={csrf} row={row} />
        ))}
      </div>
    </div>
  );
}
