"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  updateReceiptItemsAction,
  type ReceiptActionState,
} from "@/app/(app)/receipts/actions";
import { CsrfField } from "@/components/csrf-field";
import { formatCzk, parseCzkInput } from "@/lib/money";
import {
  PRICE_CATEGORIES,
  PRICE_CATEGORY_LABELS,
  isPriceCategory,
  type PriceCategory,
} from "@/lib/pricelist/categories";
import type { CheckoutCartLine } from "@/lib/receipts/checkout-schema";
import {
  PAYMENT_TYPE_LABELS,
  type PaymentType,
} from "@/lib/receipts/payment-type";

export type ReceiptEditItem = {
  id: string;
  name: string;
  priceCents: number;
  quantity: number;
  category: string;
};

export type PriceItemOption = {
  id: string;
  name: string;
  priceCents: number;
  category: string;
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
      {pending ? "Ukládám…" : "Uložit změny"}
    </button>
  );
}

export function ReceiptEditForm({
  csrf,
  receiptId,
  number,
  items,
  priceItems,
  paymentType,
  paidAt,
}: {
  csrf: string;
  receiptId: string;
  number: string;
  items: ReceiptEditItem[];
  priceItems: PriceItemOption[];
  paymentType: PaymentType;
  paidAt: Date | null;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<
    ReceiptActionState,
    FormData
  >(updateReceiptItemsAction, {});

  const [newCart, setNewCart] = useState<CheckoutCartLine[]>([]);
  const [payType, setPayType] = useState<PaymentType>(paymentType);

  const [catalogId, setCatalogId] = useState(priceItems[0]?.id ?? "");
  const [catalogQty, setCatalogQty] = useState("1");

  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customCategory, setCustomCategory] = useState<PriceCategory>("ostatni");
  const [customQty, setCustomQty] = useState("1");
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (state.success) router.push(`/receipts/${receiptId}`);
  }, [state.success, router, receiptId]);

  function addCatalogLine() {
    setAddError(null);
    const item = priceItems.find((p) => p.id === catalogId);
    if (!item || !isPriceCategory(item.category)) {
      setAddError("Vyberte položku z ceníku.");
      return;
    }
    const category = item.category;
    const qty = Math.min(999, Math.max(1, parseInt(catalogQty, 10) || 1));
    setNewCart((prev) => [
      ...prev,
      {
        kind: "catalog" as const,
        priceItemId: item.id,
        name: item.name,
        priceCents: item.priceCents,
        category,
        quantity: qty,
      },
    ]);
  }

  function addCustomLine() {
    setAddError(null);
    const name = customName.trim();
    if (!name) {
      setAddError("Zadejte název vlastní položky.");
      return;
    }
    const cents = parseCzkInput(customPrice.replace(",", "."));
    if (cents === null || cents <= 0) {
      setAddError("Zadejte platnou cenu.");
      return;
    }
    const qty = Math.min(999, Math.max(1, parseInt(customQty, 10) || 1));
    setNewCart((prev) => [
      ...prev,
      {
        kind: "custom",
        name,
        priceCents: cents,
        category: customCategory,
        quantity: qty,
      },
    ]);
    setCustomName("");
    setCustomPrice("");
  }

  function removePending(index: number) {
    setNewCart((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <div className="space-y-2">
        <Link
          href={`/receipts/${receiptId}`}
          className="text-sm text-primary hover:underline"
        >
          ← Detail účtenky
        </Link>
        <h1 className="text-xl font-semibold">Upravit {number}</h1>
        <p className="text-sm text-muted-foreground">
          Změň množství, přidej položky nebo typ platby. Nula u položky =
          odebrat z účtenky.
        </p>
        {paidAt && paymentType === "qr" ? (
          <p className="text-xs text-amber-800">
            Účtenka je uhrazená — po změně položek nemusí součet sedět s platbou
            z banky.
          </p>
        ) : null}
      </div>

      <form action={formAction} className="space-y-4">
        <CsrfField token={csrf} />
        <input type="hidden" name="receiptId" value={receiptId} />
        <input type="hidden" name="newCart" value={JSON.stringify(newCart)} />
        <input type="hidden" name="paymentType" value={payType} />

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Typ platby</legend>
          <div className="flex gap-3">
            {(["hotove", "qr"] as const).map((pt) => (
              <label
                key={pt}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="paymentTypeUi"
                  checked={payType === pt}
                  onChange={() => setPayType(pt)}
                />
                {PAYMENT_TYPE_LABELS[pt]}
              </label>
            ))}
          </div>
        </fieldset>

        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-border p-3 text-sm"
            >
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatCzk(item.priceCents)} ·{" "}
                {isPriceCategory(item.category)
                  ? PRICE_CATEGORY_LABELS[item.category]
                  : item.category}
              </p>
              <label className="mt-2 block text-xs">
                Množství
                <input
                  type="number"
                  name={`qty_${item.id}`}
                  min={0}
                  max={999}
                  defaultValue={item.quantity}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </label>
            </li>
          ))}
        </ul>

        {newCart.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              Nově přidané (uloží se s formulářem)
            </h2>
            <ul className="space-y-2 text-sm">
              {newCart.map((line, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between gap-2 rounded-md border border-dashed border-border px-3 py-2"
                >
                  <span>
                    {line.name} × {line.quantity} ({formatCzk(line.priceCents)})
                  </span>
                  <button
                    type="button"
                    className="text-xs text-destructive hover:underline"
                    onClick={() => removePending(index)}
                  >
                    Odebrat
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="space-y-3 rounded-lg border border-border p-3">
          <h2 className="text-sm font-medium">Přidat z ceníku</h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="flex-1 space-y-1 text-xs">
              Položka
              <select
                className={fieldClass}
                value={catalogId}
                onChange={(e) => setCatalogId(e.target.value)}
              >
                {priceItems.length === 0 ? (
                  <option value="">Žádné aktivní položky</option>
                ) : (
                  priceItems.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatCzk(p.priceCents)})
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="w-24 space-y-1 text-xs">
              Počet
              <input
                type="number"
                min={1}
                max={999}
                className={fieldClass}
                value={catalogQty}
                onChange={(e) => setCatalogQty(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
              onClick={addCatalogLine}
            >
              Přidat
            </button>
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-border p-3">
          <h2 className="text-sm font-medium">Vlastní položka</h2>
          <input
            className={fieldClass}
            placeholder="Název"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              className={fieldClass}
              placeholder="Cena Kč"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
            />
            <select
              className={fieldClass}
              value={customCategory}
              onChange={(e) =>
                setCustomCategory(e.target.value as PriceCategory)
              }
            >
              {PRICE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {PRICE_CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={999}
              className={fieldClass}
              value={customQty}
              onChange={(e) => setCustomQty(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
            onClick={addCustomLine}
          >
            Přidat do seznamu
          </button>
        </section>

        {addError ? (
          <p className="text-sm text-destructive" role="alert">
            {addError}
          </p>
        ) : null}
        {state.error ? (
          <p className="text-sm text-red-700" role="alert">
            {state.error}
          </p>
        ) : null}
        <SubmitButton />
      </form>
    </div>
  );
}
