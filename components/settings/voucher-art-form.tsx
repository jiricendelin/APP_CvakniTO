"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  updateVoucherArtAction,
  type MailExtraFormState,
} from "@/app/(app)/settings/mail-extra/actions";
import { CsrfField } from "@/components/csrf-field";
import type { TenantSettings } from "@/lib/settings/schema";

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

type PriceItemOption = { id: string; name: string; giftEligible: boolean };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      {pending ? "Ukládám…" : "Uložit grafiku poukazu"}
    </button>
  );
}

export function VoucherArtForm({
  csrf,
  settings,
  priceItems,
}: {
  csrf: string;
  settings: TenantSettings;
  priceItems: PriceItemOption[];
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<MailExtraFormState, FormData>(
    updateVoucherArtAction,
    {}
  );

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  const giftItems = priceItems.filter((p) => p.giftEligible);
  const fronts = settings.voucherFrontImages ?? {};

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="mx-auto w-full max-w-lg space-y-4"
    >
      <CsrfField token={csrf} />
      <p className="text-sm text-muted-foreground">
        Nahrajte přední a zadní stranu ve formátu DL na šířku (210 × 100 mm,
        ideálně 2480 × 1181 px), JPG nebo PNG. Na zadní straně se dosadí
        evidenční číslo a platnost podle pozic v % zadní strany.
      </p>

      <label className="block space-y-1 text-sm">
        <span>
          Zadní strana
          {settings.voucherBackImage
            ? ` (nahráno: ${settings.voucherBackImage})`
            : ""}
        </span>
        <input name="backImage" type="file" accept="image/jpeg,image/png" className={fieldClass} />
      </label>

      <label className="block space-y-1 text-sm">
        <span>
          Přední strana — hodnota
          {settings.voucherValueFrontImage
            ? ` (nahráno: ${settings.voucherValueFrontImage})`
            : ""}
        </span>
        <input
          name="valueFrontImage"
          type="file"
          accept="image/jpeg,image/png"
          className={fieldClass}
        />
      </label>

      <fieldset className="space-y-2 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium">
          Přední strana — služba
        </legend>
        <select name="priceItemId" className={fieldClass} defaultValue="">
          <option value="">Vyberte položku…</option>
          {giftItems.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {fronts[p.id] ? " ✓" : ""}
            </option>
          ))}
        </select>
        <input
          name="serviceFrontImage"
          type="file"
          accept="image/jpeg,image/png"
          className={fieldClass}
        />
      </fieldset>

      <fieldset className="grid grid-cols-2 gap-3 rounded-lg border border-border p-4">
        <legend className="px-1 text-sm font-medium">Pozice na zadní straně (%)</legend>
        <label className="text-xs">
          Číslo X
          <input
            name="voucherNumberX"
            type="number"
            step="0.1"
            defaultValue={settings.voucherNumberX}
            className={fieldClass}
          />
        </label>
        <label className="text-xs">
          Číslo Y
          <input
            name="voucherNumberY"
            type="number"
            step="0.1"
            defaultValue={settings.voucherNumberY}
            className={fieldClass}
          />
        </label>
        <label className="text-xs">
          Platnost X
          <input
            name="voucherValidX"
            type="number"
            step="0.1"
            defaultValue={settings.voucherValidX}
            className={fieldClass}
          />
        </label>
        <label className="text-xs">
          Platnost Y
          <input
            name="voucherValidY"
            type="number"
            step="0.1"
            defaultValue={settings.voucherValidY}
            className={fieldClass}
          />
        </label>
        <label className="text-xs">
          Velikost čísla
          <input
            name="voucherNumberFontSize"
            type="number"
            defaultValue={settings.voucherNumberFontSize}
            className={fieldClass}
          />
        </label>
        <label className="text-xs">
          Velikost platnosti
          <input
            name="voucherValidFontSize"
            type="number"
            defaultValue={settings.voucherValidFontSize}
            className={fieldClass}
          />
        </label>
      </fieldset>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-green-700">{state.success}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}
