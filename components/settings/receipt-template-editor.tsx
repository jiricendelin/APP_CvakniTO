"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  updateReceiptTemplateAction,
  type ReceiptTemplateFormState,
} from "@/app/(app)/settings/receipt-template/actions";
import { CsrfField } from "@/components/csrf-field";
import { DEFAULT_RECEIPT_TEMPLATE } from "@/lib/receipt-template/default-template";
import { buildSampleReceiptContext } from "@/lib/receipt-template/sample-context";
import { ReceiptTemplatePreview } from "./receipt-template-preview";
import {
  RECEIPT_TEMPLATE_HELPERS,
  RECEIPT_TEMPLATE_VARIABLES,
} from "@/lib/receipt-template/variables";
import { RASTER_WIDTH_PX } from "@/lib/print/constants";
import type { TenantSettings } from "@/lib/settings/schema";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Ukládám…" : "Uložit šablonu"}
    </button>
  );
}

export function ReceiptTemplateEditor({
  csrf,
  settings,
}: {
  csrf: string;
  settings: TenantSettings;
}) {
  const router = useRouter();
  const initial = settings.receiptTemplate?.trim() || DEFAULT_RECEIPT_TEMPLATE;
  const [template, setTemplate] = useState(initial);

  useEffect(() => {
    setTemplate(settings.receiptTemplate?.trim() || DEFAULT_RECEIPT_TEMPLATE);
  }, [settings.receiptTemplate]);

  const [state, formAction] = useActionState<
    ReceiptTemplateFormState,
    FormData
  >(updateReceiptTemplateAction, {});

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  const sampleContext = useMemo(
    () => buildSampleReceiptContext(settings),
    [settings]
  );

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <form action={formAction} className="space-y-4">
        <CsrfField token={csrf} />
        <div className="space-y-2">
          <label htmlFor="receiptTemplate" className="text-sm font-medium">
            Handlebars šablona
          </label>
          <textarea
            id="receiptTemplate"
            name="receiptTemplate"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={18}
            spellCheck={false}
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs leading-relaxed"
          />
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setTemplate(DEFAULT_RECEIPT_TEMPLATE)}
          >
            Obnovit výchozí šablonu
          </button>
        </div>

        {state.error && (
          <p className="text-sm text-red-700" role="alert">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="text-sm text-primary">Šablona uložena.</p>
        )}

        <SubmitButton />
      </form>

      <section className="space-y-3">
        <h2 className="text-sm font-medium">Náhled (58 mm)</h2>
        <p className="text-xs text-muted-foreground">
          Šířka {RASTER_WIDTH_PX} px · cca 32 znaků na řádek · ukázková účtenka
        </p>
        <div
          className="mx-auto rounded-md border border-dashed border-border bg-white p-3 text-black shadow-sm"
          style={{
            width: RASTER_WIDTH_PX,
            maxWidth: "100%",
            fontFamily: "ui-monospace, monospace",
            fontSize: 12,
            lineHeight: 1.35,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          <ReceiptTemplatePreview
            template={template}
            context={sampleContext}
          />
        </div>
      </section>

      <section className="space-y-2 text-sm">
        <h2 className="font-medium">Proměnné</h2>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {RECEIPT_TEMPLATE_VARIABLES.map((v) => (
            <li
              key={v.name}
              className="flex flex-col gap-0.5 px-3 py-2 sm:flex-row sm:gap-3"
            >
              <code className="shrink-0 text-xs text-primary">{`{{${v.name}}}`}</code>
              <span className="text-muted-foreground">{v.description}</span>
            </li>
          ))}
        </ul>
        <h3 className="pt-2 text-sm font-medium">Pomocné funkce</h3>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {RECEIPT_TEMPLATE_HELPERS.map((h) => (
            <li key={h.name} className="px-3 py-2">
              <code className="text-xs text-primary">{`{{${h.name} …}}`}</code>
              <span className="mt-1 block text-muted-foreground">
                {h.description}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
