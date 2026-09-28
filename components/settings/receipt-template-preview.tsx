"use client";

import { useEffect, useState } from "react";
import { registerReceiptTemplateHelpers } from "@/lib/receipt-template/register-helpers";
import type { ReceiptTemplateContext } from "@/lib/receipt-template/types";

type PreviewState =
  | { status: "loading" }
  | { status: "ok"; text: string }
  | { status: "error"; error: string };

let clientHelpersRegistered = false;

export function ReceiptTemplatePreview({
  template,
  context,
}: {
  template: string;
  context: ReceiptTemplateContext;
}) {
  const [preview, setPreview] = useState<PreviewState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const trimmed = template.trim();
      if (!trimmed) {
        setPreview({ status: "error", error: "Šablona je prázdná." });
        return;
      }

      try {
        const mod = await import("handlebars/dist/handlebars.js");
        const Handlebars = mod.default;
        if (!clientHelpersRegistered) {
          registerReceiptTemplateHelpers(Handlebars);
          clientHelpersRegistered = true;
        }
        const compiled = Handlebars.compile(trimmed, {
          strict: false,
          noEscape: true,
        });
        const text = compiled(context);
        if (cancelled) return;
        if (typeof text !== "string") {
          setPreview({ status: "error", error: "Šablona nevrátila text." });
          return;
        }
        setPreview({ status: "ok", text });
      } catch (e) {
        if (cancelled) return;
        setPreview({
          status: "error",
          error:
            e instanceof Error ? e.message : "Neplatná Handlebars šablona.",
        });
      }
    }

    setPreview({ status: "loading" });
    void run();
    return () => {
      cancelled = true;
    };
  }, [template, context]);

  if (preview.status === "loading") {
    return <span className="text-muted-foreground">Načítám náhled…</span>;
  }
  if (preview.status === "error") {
    return <span className="text-red-700">{preview.error}</span>;
  }
  return <>{preview.text}</>;
}
