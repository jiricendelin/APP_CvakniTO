import Link from "next/link";
import { formatCzk } from "@/lib/money";
import { PaymentQrCode } from "./payment-qr-code";

export function PaymentQrSection({
  spayd,
  totalCents,
  variableSymbol,
  missingIban,
}: {
  spayd: string | null;
  totalCents: number;
  variableSymbol: string;
  missingIban?: boolean;
}) {
  if (missingIban || !spayd) {
    return (
      <section className="space-y-2 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/5 p-4 text-sm">
        <p className="font-medium text-foreground">
          QR platbu nelze zobrazit
        </p>
        <p className="text-muted-foreground">
          {missingIban
            ? "V nastavení chybí platný IBAN. Doplňte ho, aby šel vygenerovat platební QR kód."
            : "Platební QR se nepodařilo sestavit."}
        </p>
        <Link href="/settings" className="text-primary hover:underline">
          Nastavení firmy →
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="text-center">
        <h2 className="text-sm font-medium">Platba QR převodem</h2>
        <p className="mt-1 text-2xl font-bold tabular-nums text-primary">
          {formatCzk(totalCents)}
        </p>
        <p className="text-xs text-muted-foreground">
          VS{" "}
          <span className="font-mono font-medium text-foreground">
            {variableSymbol}
          </span>
        </p>
      </div>
      <PaymentQrCode payload={spayd} />
      <p className="text-center text-xs text-muted-foreground">
        Naskenujte v bankovní aplikaci a potvrďte platbu.
      </p>
    </section>
  );
}
