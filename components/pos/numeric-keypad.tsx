"use client";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"] as const;

export function NumericKeypad({
  onKey,
  allowDecimal,
}: {
  onKey: (key: (typeof KEYS)[number] | ",") => void;
  allowDecimal?: boolean;
}) {
  const keyClass =
    "flex min-h-[3rem] items-center justify-center rounded-lg border border-border bg-background text-xl font-semibold active:bg-accent touch-manipulation select-none";

  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map((k) => (
        <button key={k} type="button" className={keyClass} onClick={() => onKey(k)}>
          {k}
        </button>
      ))}
      {allowDecimal ? (
        <button
          type="button"
          className={`${keyClass} col-span-3 min-h-[2.75rem] text-lg`}
          onClick={() => onKey(",")}
        >
          ,
        </button>
      ) : null}
    </div>
  );
}
