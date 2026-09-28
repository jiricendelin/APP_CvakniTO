"use client";

import { useState } from "react";
import type { ReceiptPrintPayload } from "@/lib/receipt-template/render-print";
import {
  connectReceiptPrinter,
  printReceiptPayload,
} from "@/lib/print/receipt-printer";

export function ReceiptPrintButton({
  printPayload,
}: {
  printPayload: ReceiptPrintPayload | null;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!printPayload) {
    return (
      <p className="text-sm text-muted-foreground">
        Tisk účtenky není k dispozici (zkontrolujte šablonu v nastavení).
      </p>
    );
  }

  async function handlePrint() {
    if (!printPayload) return;
    setBusy(true);
    setMessage(null);
    const result = await printReceiptPayload(printPayload);
    setBusy(false);
    if (result.ok) {
      setMessage("Účtenka vytištěna.");
      return;
    }
    setMessage(result.message);
  }

  async function handleConnect() {
    setBusy(true);
    setMessage(null);
    const result = await connectReceiptPrinter();
    setBusy(false);
    setMessage(
      result.ok ? "Tiskárna připojená." : result.message
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={busy}
          onClick={handlePrint}
          className="inline-flex justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Tisknu…" : "Vytisknout znovu"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleConnect}
          className="inline-flex justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-60"
        >
          Připojit tiskárnu
        </button>
      </div>
      {message && (
        <p
          className="text-sm text-muted-foreground"
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}
