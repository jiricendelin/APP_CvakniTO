"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatCzk, parseCzkInput } from "@/lib/money";
import {
  PRICE_CATEGORIES,
  PRICE_CATEGORY_LABELS,
  type PriceCategory,
} from "@/lib/pricelist/categories";
import {
  cartTotal,
  type CartLine,
  type CatalogProduct,
} from "@/lib/pos/types";
import { NumericKeypad } from "./numeric-keypad";
import {
  CheckoutPanel,
  loadPrintOnIssuePreference,
} from "./checkout-panel";

type KeypadTarget = "quantity" | "customPrice";

function newKey(): string {
  return crypto.randomUUID();
}

function applyKeypadValue(
  current: string,
  key: string,
  allowDecimal: boolean
): string {
  if (key === "C") return "";
  if (key === "⌫") return current.slice(0, -1);
  if (key === ",") {
    if (!allowDecimal || current.includes(",")) return current;
    return current ? `${current},` : "0,";
  }
  if (key >= "0" && key <= "9") {
    if (current === "0" && !current.includes(",")) return key;
    return current + key;
  }
  return current;
}

function parseQuantity(raw: string): number {
  const n = parseInt(raw.replace(/\D/g, "") || "1", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 999);
}

export function PosRegister({
  items,
  csrf,
}: {
  items: CatalogProduct[];
  csrf: string;
}) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [printOnIssue, setPrintOnIssue] = useState(false);
  const [qtyInput, setQtyInput] = useState("1");
  const [keypadTarget, setKeypadTarget] = useState<KeypadTarget>("quantity");
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");
  const [customCategory, setCustomCategory] = useState<PriceCategory>("ostatni");
  const [customError, setCustomError] = useState<string | null>(null);

  const totalCents = useMemo(() => cartTotal(cart), [cart]);
  const pendingQty = parseQuantity(qtyInput);

  useEffect(() => {
    setPrintOnIssue(loadPrintOnIssuePreference());
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const handleKeypad = useCallback(
    (key: string) => {
      if (keypadTarget === "quantity") {
        setQtyInput((v) => applyKeypadValue(v, key, false));
        return;
      }
      setCustomPrice((v) => applyKeypadValue(v, key, true));
    },
    [keypadTarget]
  );

  const addCatalog = (product: CatalogProduct) => {
    const qty = pendingQty;
    setCart((prev) => {
      const idx = prev.findIndex(
        (l) => l.kind === "catalog" && l.priceItemId === product.id
      );
      if (idx >= 0) {
        const next = [...prev];
        const line = next[idx]!;
        if (line.kind === "catalog") {
          next[idx] = { ...line, quantity: line.quantity + qty };
        }
        return next;
      }
      return [
        ...prev,
        {
          key: newKey(),
          kind: "catalog",
          priceItemId: product.id,
          name: product.name,
          priceCents: product.priceCents,
          category: product.category,
          quantity: qty,
        },
      ];
    });
    setQtyInput("1");
  };

  const addCustom = () => {
    setCustomError(null);
    const name = customName.trim();
    if (!name) {
      setCustomError("Zadej název položky.");
      return;
    }
    const cents = parseCzkInput(customPrice.replace(",", "."));
    if (cents === null || cents <= 0) {
      setCustomError("Zadej cenu v Kč.");
      return;
    }
    const qty = pendingQty;
    setCart((prev) => [
      ...prev,
      {
        key: newKey(),
        kind: "custom",
        name,
        priceCents: cents,
        category: customCategory,
        quantity: qty,
      },
    ]);
    setCustomName("");
    setCustomPrice("");
    setQtyInput("1");
    setKeypadTarget("quantity");
  };

  const updateLineQty = (key: string, quantity: number) => {
    if (quantity < 1) {
      setCart((prev) => prev.filter((l) => l.key !== key));
      return;
    }
    setCart((prev) =>
      prev.map((l) => (l.key === key ? { ...l, quantity } : l))
    );
  };

  const removeLine = (key: string) => {
    setCart((prev) => prev.filter((l) => l.key !== key));
  };

  const productBtnClass =
    "flex min-h-[4.5rem] flex-col items-center justify-center rounded-xl border border-border bg-card px-2 py-3 text-center active:bg-accent touch-manipulation";

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 pb-4">
      <div className="sticky top-0 z-10 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <h1 className="text-lg font-semibold">Pokladna</h1>
        <p className="text-2xl font-bold tabular-nums text-primary">
          {formatCzk(totalCents)}
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Košík</h2>
        {cart.length === 0 ? (
          <p className="text-sm text-muted-foreground">Košík je prázdný.</p>
        ) : (
          <ul className="space-y-2">
            {cart.map((line) => (
              <li
                key={line.key}
                className="rounded-lg border border-border p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{line.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCzk(line.priceCents)} ·{" "}
                      {PRICE_CATEGORY_LABELS[line.category]}
                      {line.kind === "custom" ? " · mimo ceník" : ""}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium tabular-nums">
                    {formatCzk(line.priceCents * line.quantity)}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    aria-label="Méně"
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-lg font-semibold active:bg-accent"
                    onClick={() => updateLineQty(line.key, line.quantity - 1)}
                  >
                    −
                  </button>
                  <span className="min-w-[2rem] text-center font-medium tabular-nums">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Více"
                    className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-lg font-semibold active:bg-accent"
                    onClick={() => updateLineQty(line.key, line.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className="ml-auto rounded-md px-3 py-2 text-xs text-red-700 active:bg-red-50"
                    onClick={() => removeLine(line.key)}
                  >
                    Odebrat
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <CheckoutPanel
        csrf={csrf}
        cart={cart}
        printOnIssue={printOnIssue}
        onPrintChange={setPrintOnIssue}
        onCheckoutSuccess={clearCart}
      />

      <section className="space-y-2 rounded-lg border border-border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Počet k přidání</h2>
          <span className="text-2xl font-bold tabular-nums">{pendingQty}</span>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 ${
              keypadTarget === "quantity"
                ? "bg-primary text-primary-foreground"
                : "border border-border"
            }`}
            onClick={() => setKeypadTarget("quantity")}
          >
            Počet
          </button>
        </div>
        <NumericKeypad
          onKey={handleKeypad}
          allowDecimal={keypadTarget === "customPrice"}
        />
      </section>

      <section className="rounded-lg border border-dashed border-border">
        <button
          type="button"
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium"
          onClick={() => setCustomOpen((o) => !o)}
        >
          Položka mimo ceník
          <span className="text-muted-foreground">{customOpen ? "▲" : "▼"}</span>
        </button>
        {customOpen && (
          <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Název"
              className="w-full rounded-md border border-input bg-background px-3 py-3 text-sm"
            />
            <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-[8rem] flex-1 text-xs">
                Cena (Kč)
                <button
                  type="button"
                  className={`mt-1 flex w-full items-center justify-between rounded-md border px-3 py-3 text-left text-lg font-semibold tabular-nums ${
                    keypadTarget === "customPrice"
                      ? "border-primary ring-1 ring-primary"
                      : "border-input"
                  }`}
                  onClick={() => setKeypadTarget("customPrice")}
                >
                  {customPrice || "0"}
                  <span className="text-xs font-normal text-muted-foreground">
                    klepni pro klávesnici
                  </span>
                </button>
              </label>
              <label className="text-xs">
                Kategorie
                <select
                  value={customCategory}
                  onChange={(e) =>
                    setCustomCategory(e.target.value as PriceCategory)
                  }
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-3 text-sm"
                >
                  {PRICE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {PRICE_CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {customError && (
              <p className="text-sm text-red-700" role="alert">
                {customError}
              </p>
            )}
            <button
              type="button"
              className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground active:opacity-90"
              onClick={addCustom}
            >
              Přidat do košíku
            </button>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Ceník</h2>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Žádné aktivní položky — doplň ceník v nastavení.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={productBtnClass}
                onClick={() => addCatalog(item)}
              >
                <span className="line-clamp-2 text-sm font-semibold leading-tight">
                  {item.name}
                </span>
                <span className="mt-1 text-xs tabular-nums text-muted-foreground">
                  {formatCzk(item.priceCents)}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
