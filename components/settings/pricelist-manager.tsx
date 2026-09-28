"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createPriceItemAction,
  setPriceItemActiveAction,
  updatePriceItemAction,
  type PricelistActionState,
} from "@/app/(app)/settings/pricelist/actions";
import { CsrfField } from "@/components/csrf-field";
import { formatCzk } from "@/lib/money";
import {
  PRICE_CATEGORIES,
  PRICE_CATEGORY_LABELS,
  isPriceCategory,
} from "@/lib/pricelist/categories";

export type PriceItemRow = {
  id: string;
  name: string;
  priceCents: number;
  category: string;
  active: boolean;
  sortOrder: number;
};

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      {pending ? "Ukládám…" : label}
    </button>
  );
}

function CategorySelect({
  name,
  defaultValue,
  required,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <select
      name={name}
      required={required}
      defaultValue={defaultValue ?? ""}
      className={fieldClass}
    >
      <option value="" disabled>
        Kategorie…
      </option>
      {PRICE_CATEGORIES.map((cat) => (
        <option key={cat} value={cat}>
          {PRICE_CATEGORY_LABELS[cat]}
        </option>
      ))}
    </select>
  );
}

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function AddItemForm({ csrf }: { csrf: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState<
    PricelistActionState,
    FormData
  >(createPriceItemAction, {});

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border p-4">
      <p className="text-sm font-medium">Nová položka</p>
      <CsrfField token={csrf} />
      <input
        name="name"
        placeholder="Název"
        required
        className={fieldClass}
      />
      <input
        name="price"
        placeholder="Cena v Kč (800 nebo 800,50)"
        required
        inputMode="decimal"
        className={fieldClass}
      />
      <CategorySelect name="category" required />
      {state.error && (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm text-primary" role="status">
          Položka přidána.
        </p>
      )}
      <SubmitButton label="Přidat položku" />
    </form>
  );
}

function EditItemForm({
  csrf,
  item,
  onDone,
}: {
  csrf: string;
  item: PriceItemRow;
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<
    PricelistActionState,
    FormData
  >(updatePriceItemAction, {});

  useEffect(() => {
    if (state.success) {
      router.refresh();
      onDone();
    }
  }, [state.success, router, onDone]);

  const category = isPriceCategory(item.category)
    ? item.category
    : "ostatni";

  return (
    <form action={formAction} className="mt-3 space-y-3 border-t border-border pt-3">
      <CsrfField token={csrf} />
      <input type="hidden" name="id" value={item.id} />
      <input name="name" defaultValue={item.name} required className={fieldClass} />
      <input
        name="price"
        defaultValue={centsToInput(item.priceCents)}
        required
        inputMode="decimal"
        className={fieldClass}
      />
      <CategorySelect name="category" defaultValue={category} required />
      <label className="block text-xs">
        Pořadí
        <input
          name="sortOrder"
          type="number"
          defaultValue={item.sortOrder}
          className={`${fieldClass} mt-1`}
        />
      </label>
      {state.error && (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <SubmitButton label="Uložit změny" />
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-border px-4 py-2 text-sm"
        >
          Zrušit
        </button>
      </div>
    </form>
  );
}

function ToggleActiveButton({
  csrf,
  item,
}: {
  csrf: string;
  item: PriceItemRow;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState<
    PricelistActionState,
    FormData
  >(setPriceItemActiveAction, {});

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form action={formAction}>
      <CsrfField token={csrf} />
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="active" value={item.active ? "false" : "true"} />
      <button
        type="submit"
        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
      >
        {item.active ? "Deaktivovat" : "Aktivovat"}
      </button>
    </form>
  );
}

function ItemRow({ csrf, item }: { csrf: string; item: PriceItemRow }) {
  const [editing, setEditing] = useState(false);
  const categoryLabel = isPriceCategory(item.category)
    ? PRICE_CATEGORY_LABELS[item.category]
    : item.category;

  return (
    <li
      className={`rounded-lg border border-border p-4 ${!item.active ? "opacity-60" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCzk(item.priceCents)} · {categoryLabel}
            {!item.active && " · neaktivní"}
          </p>
          <p className="text-xs text-muted-foreground">Pořadí {item.sortOrder}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
            >
              Upravit
            </button>
          )}
          <ToggleActiveButton csrf={csrf} item={item} />
        </div>
      </div>
      {editing && (
        <EditItemForm
          csrf={csrf}
          item={item}
          onDone={() => setEditing(false)}
        />
      )}
    </li>
  );
}

export function PricelistManager({
  csrf,
  items,
}: {
  csrf: string;
  items: PriceItemRow[];
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
        <h1 className="text-xl font-semibold">Ceník</h1>
        <p className="text-sm text-muted-foreground">
          Položky pro pokladnu. Neaktivní se v pokladně neukážou.
        </p>
      </div>

      <AddItemForm csrf={csrf} />

      <ul className="space-y-3">
        {items.length === 0 ? (
          <li className="text-sm text-muted-foreground">
            Ceník je prázdný. Přidej první položku nebo spusť seed.
          </li>
        ) : (
          items.map((item) => (
            <ItemRow key={item.id} csrf={csrf} item={item} />
          ))
        )}
      </ul>
    </div>
  );
}
