"use client";

import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lock,
  Settings,
  Sparkles,
} from "lucide-react";
import { getSortedModules } from "@/core/module-registry";
import { hasEntitlement } from "@/core/entitlements";
import type { HubUser } from "@/core/auth/types";
import { signOut } from "@/core/auth/actions";
import {
  Badge,
  BrandMark,
  FormSubmit,
  NavItem,
  ThemeSync,
} from "@/design-system";
import { NotificationBell } from "@/modules/notifications/ui/notification-bell";
import type { HubNotification } from "@/modules/notifications/types";
import type { AiLocale } from "@/modules/ai-intel/i18n/locale";
import { MobileBottomNav } from "@/shared/ui/mobile-bottom-nav";

const SHELL_COPY = {
  fr: {
    overview: "Aperçu",
    ai: "AI",
    cv: "CV",
    jobs: "Offres",
    snippets: "Snippets",
    settings: "Réglages",
    signOut: "Se déconnecter",
  },
  en: {
    overview: "Overview",
    ai: "AI",
    cv: "CV",
    jobs: "Jobs",
    snippets: "Snippets",
    settings: "Settings",
    signOut: "Sign out",
  },
} as const;

export function AppShell({
  user,
  notifications = [],
  locale = "fr",
  children,
}: {
  user: HubUser;
  notifications?: HubNotification[];
  locale?: AiLocale;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const modules = getSortedModules();
  const plan = user.subscription?.plan ?? "free";
  const copy = SHELL_COPY[locale];

  return (
    <div className="min-h-dvh bg-background">
      <ThemeSync theme={user.preferences?.theme ?? "system"} />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--dh-sidebar-w)] flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center gap-[var(--dh-space-2)] border-b border-border px-[var(--dh-space-5)]">
          <BrandMark withWordmark href="/app/overview" />
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell initialNotifications={notifications} />
            <Badge tone="neutral" className="capitalize">
              {plan}
            </Badge>
          </div>
        </div>

        <nav className="flex-1 space-y-[var(--dh-space-1)] p-[var(--dh-space-3)]">
          {modules.map((mod) => {
            const locked =
              mod.status === "coming_soon" ||
              !hasEntitlement(user.entitlements, mod.requiredEntitlement);
            return (
              <NavItem
                key={mod.id}
                href={mod.href}
                label={mod.label}
                icon={mod.icon}
                active={pathname.startsWith(mod.href)}
                trailing={
                  <>
                    {locked ? <Lock className="h-3.5 w-3.5 opacity-60" /> : null}
                    {mod.status === "coming_soon" ? (
                      <Sparkles className="h-3.5 w-3.5 opacity-60" />
                    ) : null}
                  </>
                }
              />
            );
          })}
        </nav>

        <div className="space-y-[var(--dh-space-1)] border-t border-border p-[var(--dh-space-3)]">
          <NavItem
            href="/app/settings"
            label={copy.settings}
            icon={Settings}
            active={pathname.startsWith("/app/settings")}
          />
          {user.profile.role === "admin" ? (
            <NavItem
              href="/admin"
              label="Admin"
              icon={LayoutDashboard}
              active={pathname.startsWith("/admin")}
            />
          ) : null}
          <form action={signOut}>
            <FormSubmit variant="ghost" className="justify-start px-[var(--dh-space-3)]">
              {copy.signOut}
            </FormSubmit>
          </form>
        </div>
      </aside>

      <header
        className="sticky top-0 z-20 border-b border-border bg-card/90 px-[var(--dh-space-4)] backdrop-blur lg:hidden"
        style={{ paddingTop: "var(--dh-safe-top)" }}
      >
        <div className="flex h-[var(--dh-topbar-h)] items-center justify-between">
          <BrandMark withWordmark href="/app/overview" size="sm" />
          <div className="flex items-center gap-1">
            <NotificationBell initialNotifications={notifications} />
            <Badge tone="neutral" className="capitalize">
              {plan}
            </Badge>
          </div>
        </div>
      </header>

      <main className="lg:pl-[var(--dh-sidebar-w)]">
        <div className="mx-auto w-full max-w-[var(--dh-content-max)] px-[var(--dh-space-4)] py-[var(--dh-space-5)] pb-[calc(var(--dh-bottom-nav-measured,var(--dh-bottom-nav-h))+var(--dh-safe-bottom)+3rem)] lg:px-[var(--dh-space-8)] lg:py-[var(--dh-space-8)] lg:pb-[var(--dh-space-8)]">
          {children}
        </div>
      </main>

      <MobileBottomNav labels={copy} />
    </div>
  );
}
