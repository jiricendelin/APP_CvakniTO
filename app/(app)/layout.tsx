import { requireUser, getTenantId } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { ThemeVars } from "@/components/theme-vars";
import { DEFAULT_PRIMARY_COLOR } from "@/lib/color";
import { getTenantSettings } from "@/lib/settings/repository";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const tenantId = await getTenantId();
  const settings = await getTenantSettings(tenantId);
  const primaryColor = settings.primaryColor || DEFAULT_PRIMARY_COLOR;

  return (
    <>
      <ThemeVars primaryColor={primaryColor} />
      <AppShell email={user.email}>{children}</AppShell>
    </>
  );
}
