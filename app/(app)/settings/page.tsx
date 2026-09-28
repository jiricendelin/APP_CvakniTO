import Link from "next/link";
import { getCsrfToken } from "@/lib/auth/csrf";
import { getTenantId } from "@/lib/auth";
import { getTenantSettings } from "@/lib/settings/repository";
import { GeneralSettingsForm } from "@/components/settings/general-settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [csrf, tenantId] = await Promise.all([getCsrfToken(), getTenantId()]);
  const settings = await getTenantSettings(tenantId);

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-semibold">Nastavení</h1>
      <p className="text-sm text-muted-foreground">
        Firma, platební údaje a barva aplikace.
      </p>
      <nav className="flex flex-col gap-2 text-sm">
        <Link
          href="/settings/pricelist"
          className="rounded-lg border border-border px-4 py-3 font-medium hover:bg-accent"
        >
          Ceník →
        </Link>
        <Link
          href="/settings/sequences"
          className="rounded-lg border border-border px-4 py-3 font-medium hover:bg-accent"
        >
          Číselné řady →
        </Link>
        <Link
          href="/settings/receipt-template"
          className="rounded-lg border border-border px-4 py-3 font-medium hover:bg-accent"
        >
          Šablona účtenky →
        </Link>
        <Link
          href="/settings/smtp"
          className="rounded-lg border border-border px-4 py-3 font-medium hover:bg-accent"
        >
          E-mail (SMTP) →
        </Link>
        <Link
          href="/settings/email-templates"
          className="rounded-lg border border-border px-4 py-3 font-medium hover:bg-accent"
        >
          E-mailové šablony →
        </Link>
      </nav>
      <GeneralSettingsForm csrf={csrf} settings={settings} />
    </div>
  );
}
