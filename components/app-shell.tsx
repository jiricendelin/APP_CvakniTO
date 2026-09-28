"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Store,
  Receipt,
  FileText,
  Users,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/logout/actions";
import { APP_VERSION } from "@/lib/version";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const navItems: NavItem[] = [
  { href: "/", label: "Pokladna", icon: Store, exact: true },
  { href: "/receipts", label: "Účtenky", icon: Receipt },
  { href: "/invoices", label: "Faktury", icon: FileText },
  { href: "/customers", label: "Zákazníci", icon: Users },
  { href: "/reports", label: "Přehledy", icon: BarChart3 },
  { href: "/settings", label: "Nastavení", icon: Settings },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {navItems.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link
      href="/"
      className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1 transition-opacity hover:opacity-80"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
        CT
      </div>
      <span className="truncate text-lg font-semibold">CvakniTO</span>
    </Link>
  );
}

function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] print:hidden lg:hidden"
      aria-label="Hlavní navigace"
    >
      <div className="grid grid-cols-6">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-0 flex-col items-center gap-0.5 px-0.5 py-2 text-[9px] font-medium leading-tight transition-colors sm:text-[10px]",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="max-w-full truncate text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-dvh overflow-x-hidden lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-border bg-card/60 print:hidden lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-border px-4">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <NavLinks />
        </div>
        <div className="border-t border-border p-4">
          <p className="mb-2 px-2 text-[10px] text-muted-foreground/70">
            Verze {APP_VERSION}
          </p>
          <p className="mb-2 truncate px-2 text-xs text-muted-foreground">
            {email}
          </p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-start gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
              Odhlásit se
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4 print:hidden lg:hidden">
          <Brand />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent"
            aria-label="Otevřít menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <div className="absolute left-0 top-0 flex h-full w-[min(100%,18rem)] flex-col bg-background shadow-xl">
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <Brand />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent"
                  aria-label="Zavřít menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="border-t border-border p-4">
                <p className="mb-2 px-2 text-[10px] text-muted-foreground/70">
                  Verze {APP_VERSION}
                </p>
                <p className="mb-2 truncate px-2 text-xs text-muted-foreground">
                  {email}
                </p>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-start gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" />
                    Odhlásit se
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 p-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:p-6 lg:p-8 lg:pb-8 print:p-0">
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
