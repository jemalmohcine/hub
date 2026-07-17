"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lock,
  Settings,
  Sparkles,
} from "lucide-react";
import { getSortedModules } from "@/core/module-registry";
import { hasEntitlement } from "@/core/entitlements";
import { cn } from "@/shared/ui";
import type { HubUser } from "@/core/auth/types";
import { signOut } from "@/core/auth/actions";

export function AppShell({
  user,
  children,
}: {
  user: HubUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const modules = getSortedModules();
  const plan = user.subscription?.plan ?? "free";

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-surface lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white dark:text-[#0c1222]">
            H
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">DevHub</p>
            <p className="text-xs text-muted capitalize">{plan}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const locked =
              mod.status === "coming_soon" ||
              !hasEntitlement(user.entitlements, mod.requiredEntitlement);
            const active = pathname.startsWith(mod.href);
            return (
              <Link
                key={mod.id}
                href={mod.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                  active
                    ? "bg-accent-soft text-accent font-medium"
                    : "text-muted hover:bg-surface-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{mod.label}</span>
                {locked ? <Lock className="h-3.5 w-3.5 opacity-60" /> : null}
                {mod.status === "coming_soon" ? (
                  <Sparkles className="h-3.5 w-3.5 opacity-60" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3 space-y-1">
          <Link
            href="/app/settings"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
              pathname.startsWith("/app/settings")
                ? "bg-accent-soft text-accent font-medium"
                : "text-muted hover:bg-surface-muted hover:text-foreground",
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          {user.profile.role === "admin" ? (
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-surface-muted hover:text-foreground"
            >
              <LayoutDashboard className="h-4 w-4" />
              Admin
            </Link>
          ) : null}
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-muted hover:bg-surface-muted hover:text-foreground"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      {/* Top bar mobile */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white dark:text-[#0c1222]">
            H
          </div>
          <span className="font-semibold tracking-tight">DevHub</span>
        </div>
        <span className="rounded-lg bg-surface-muted px-2 py-1 text-xs capitalize text-muted">
          {plan}
        </span>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-5xl px-4 py-5 pb-[calc(5rem+var(--safe-bottom))] lg:px-8 lg:py-8 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Bottom nav mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: "var(--safe-bottom)" }}
      >
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-1 px-2 py-2">
          <Link
            href="/app/overview"
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px]",
              pathname.startsWith("/app/overview")
                ? "text-accent"
                : "text-muted",
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            Overview
          </Link>
          <Link
            href="/app/ai"
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px]",
              pathname.startsWith("/app/ai") ? "text-accent" : "text-muted",
            )}
          >
            <Sparkles className="h-5 w-5" />
            Modules
          </Link>
          <Link
            href="/app/settings"
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px]",
              pathname.startsWith("/app/settings")
                ? "text-accent"
                : "text-muted",
            )}
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </nav>
    </div>
  );
}
