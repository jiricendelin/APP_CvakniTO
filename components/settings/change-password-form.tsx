"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import {
  changePasswordAction,
  type SettingsFormState,
} from "@/app/(app)/settings/actions";
import { CsrfField } from "@/components/csrf-field";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Ukládám…" : "Změnit heslo"}
    </button>
  );
}

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

export function ChangePasswordForm({
  csrf,
  email,
}: {
  csrf: string;
  email: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState<SettingsFormState, FormData>(
    changePasswordAction,
    {}
  );

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <section className="space-y-1">
        <h2 className="text-lg font-semibold">Účet</h2>
        <p className="text-sm text-muted-foreground">{email}</p>
      </section>

      <form ref={formRef} action={formAction} className="space-y-4">
        <CsrfField token={csrf} />

        <div className="space-y-2">
          <label htmlFor="currentPassword" className="text-sm font-medium">
            Současné heslo
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            className={fieldClass}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="newPassword" className="text-sm font-medium">
            Nové heslo
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            className={fieldClass}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium">
            Nové heslo znovu
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            className={fieldClass}
            required
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-700" role="alert">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="text-sm text-primary" role="status">
            Heslo změněno.
          </p>
        )}

        <SubmitButton />
      </form>
    </div>
  );
}
