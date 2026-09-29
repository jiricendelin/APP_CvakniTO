"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  createInvoiceAction,
  type InvoiceActionState,
} from "@/app/(app)/invoices/actions";
import { CsrfField } from "@/components/csrf-field";
import { formatCzk, parseCzkInput } from "@/lib/money";
import {
  PRICE_CATEGORIES,
  PRICE_CATEGORY_LABELS,
  type PriceCategory,
} from "@/lib/pricelist/categories";

type CustomerOption = { id: string; name: string };

type CatalogItem = {
  id: string;
  name: string;
  priceCents: number;
  category: string;
};

type DraftLine = {
  key: string;
  name: string;
  quantity: number;
  priceInput: string;
  category: PriceCategory;
};

const fieldClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Ukládám koncept…" : "Vytvořit koncept"}
    </button>
  );
}

function newKey(): string {
  return crypto.randomUUID();
}

export function InvoiceCreateForm({
  csrf,
  customers,
  catalog,
  defaultDueDate,
}: {
  csrf: string;
  customers: CustomerOption[];
  catalog: CatalogItem[];
  defaultDueDate: string;
}) {
  const [lines, setLines] = useState<DraftLine[]>([
    {
      key: newKey(),
      name: "",
      quantity: 1,
      priceInput: "",
      category: "ostatni",
    },
  ]);
  const [state, formAction] = useActionState<
    InvoiceActionState,
    FormData
  >(createInvoiceAction, {});

  const serializedLines = useMemo(() => {
    const out: {
      name: string;
      quantity: number;
      priceCents: number;
      category: PriceCategory;
    }[] = [];
    for (const line of lines) {
      const name = line.name.trim();
      const priceCents = parseCzkInput(line.priceInput);
      if (!name || priceCents === null || priceCents < 0) continue;
      out.push({
        name,
        quantity: line.quantity,
        priceCents,
        category: line.category,
      });
    }
    return out;
  }, [lines]);

  const previewTotal = serializedLines.reduce(
    (s, l) => s + l.priceCents * l.quantity,
    0
  );

  function addBlankLine() {
    setLines((prev) => [
      ...prev,
      {
        key: newKey(),
        name: "",
        quantity: 1,
        priceInput: "",
        category: "ostatni",
      },
    ]);
  }

  function addFromCatalog(item: CatalogItem) {
    if (!PRICE_CATEGORIES.includes(item.category as PriceCategory)) return;
    setLines((prev) => [
      ...prev,
      {
        key: newKey(),
        name: item.name,
        quantity: 1,
        priceInput: (item.priceCents / 100).toFixed(2).replace(".", ","),
        category: item.category as PriceCategory,
      },
    ]);
  }

  function removeLine(key: string) {
    setLines((prev) =>
      prev.length <= 1 ? prev : prev.filter((l) => l.key !== key)
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      <Link href="/invoices" className="text-sm text-primary hover:underline">
        ← Faktury
      </Link>

      <form action={formAction} className="space-y-4">
        <CsrfField token={csrf} />
        <input
          type="hidden"
          name="lines"
          value={JSON.stringify(serializedLines)}
          readOnly
        />

        <label className="block space-y-1 text-sm">
          <span className="font-medium">Zákazník</span>
          <select
            name="customerId"
            required
            className={fieldClass}
            defaultValue=""
          >
            <option value="" disabled>
              Vyberte zákazníka…
            </option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {customers.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nejdřív{" "}
            <Link href="/customers" className="text-primary hover:underline">
              přidejte zákazníka
            </Link>
            .
          </p>
        )}

        <label className="block space-y-1 text-sm">
          <span className="font-medium">Splatnost</span>
          <input
            type="date"
            name="dueDate"
            required
            defaultValue={defaultDueDate}
            className={fieldClass}
          />
        </label>

        {catalog.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Přidat z ceníku</p>
            <div className="flex flex-wrap gap-2">
              {catalog.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => addFromCatalog(item)}
                  className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-sm font-medium">Položky</p>
          {lines.map((line) => (
            <div
              key={line.key}
              className="space-y-2 rounded-lg border border-border p-3"
            >
              <input
                placeholder="Název položky"
                value={line.name}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l) =>
                      l.key === line.key ? { ...l, name: e.target.value } : l
                    )
                  )
                }
                className={fieldClass}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={1}
                  value={line.quantity}
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((l) =>
                        l.key === line.key
                          ? {
                              ...l,
                              quantity: Math.max(
                                1,
                                parseInt(e.target.value, 10) || 1
                              ),
                            }
                          : l
                      )
                    )
                  }
                  className={fieldClass}
                  aria-label="Množství"
                />
                <input
                  placeholder="Cena Kč"
                  inputMode="decimal"
                  value={line.priceInput}
                  onChange={(e) =>
                    setLines((prev) =>
                      prev.map((l) =>
                        l.key === line.key
                          ? { ...l, priceInput: e.target.value }
                          : l
                      )
                    )
                  }
                  className={fieldClass}
                />
              </div>
              <select
                value={line.category}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l) =>
                      l.key === line.key
                        ? {
                            ...l,
                            category: e.target.value as PriceCategory,
                          }
                        : l
                    )
                  )
                }
                className={fieldClass}
              >
                {PRICE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {PRICE_CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeLine(line.key)}
                className="text-xs text-red-800 hover:underline"
              >
                Odebrat řádek
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addBlankLine}
            className="text-sm text-primary hover:underline"
          >
            + Další položka
          </button>
        </div>

        <p className="text-right text-lg font-semibold tabular-nums text-primary">
          Náhled součtu: {formatCzk(previewTotal)}
        </p>

        {state.error && (
          <p className="text-sm text-red-700" role="alert">
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>
    </div>
  );
}
