"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Code2,
  LayoutDashboard,
  MoreHorizontal,
  Settings,
  Shield,
  Sparkles,
} from "lucide-react";
import { getModule } from "@/core/module-registry";
import { BottomNavItem, FormSubmit, Sheet, Text } from "@/design-system";
import { signOut } from "@/core/auth/actions";
import { cn } from "@/design-system/lib/cn";

export type MobileNavLabels = {
  overview: string;
  ai: string;
  career: string;
  snippets: string;
  more: string;
  settings: string;
  signOut: string;
};

type Tab = {
  href: string;
  labelKey: keyof MobileNavLabels;
  icon: LucideIcon;
  matches: (path: string) => boolean;
};

const TABS: Tab[] = [
  {
    href: "/app/overview",
    labelKey: "overview",
    icon: LayoutDashboard,
    matches: (path) => path.startsWith("/app/overview"),
  },
  {
    href: "/app/ai",
    labelKey: "ai",
    icon: Sparkles,
    matches: (path) => path.startsWith("/app/ai"),
  },
  {
    href: "/app/career",
    labelKey: "career",
    icon: Briefcase,
    matches: (path) =>
      path.startsWith("/app/career") ||
      path.startsWith("/app/cv") ||
      path.startsWith("/app/jobs"),
  },
  {
    href: "/app/snippets",
    labelKey: "snippets",
    icon: Code2,
    matches: (path) => path.startsWith("/app/snippets"),
  },
];

/** Destinations that don't fit in the bar, reachable through "Plus". */
const OVERFLOW_PATHS = ["/app/expenses", "/app/settings", "/admin"];

function SheetLink({
  href,
  label,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors active:bg-muted"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </span>
      <Text as="span" size="sm" weight="medium">
        {label}
      </Text>
    </Link>
  );
}

export function MobileBottomNav({
  labels,
  isAdmin = false,
}: {
  labels: MobileNavLabels;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const expenses = getModule("expenses");
  const inOverflow = OVERFLOW_PATHS.some((path) => pathname.startsWith(path));
  const closeSheet = () => setMoreOpen(false);

  return (
    <>
      {/*
        In document flow at the bottom of the shell. Padding uses
        --ios-pwa-bottom-gap (measured in standalone, env() elsewhere) so the
        card background paints the home-indicator strip. Do not position:fixed
        this to bottom: 0 — that anchors to the lying viewport and leaves a
        black gap on iOS PWAs.
      */}
      <nav
        aria-label="Navigation principale"
        className="mobile-bottom-nav z-30 shrink-0 border-t border-border bg-card lg:hidden"
        style={{ paddingBottom: "calc(var(--ios-pwa-bottom-gap) + var(--bottom-nav-pad))" }}
      >
        <div className="mx-auto grid h-[var(--dh-bottom-nav-h)] max-w-lg grid-cols-5 items-center px-1">
          {TABS.map((tab) => (
            <BottomNavItem
              key={tab.href}
              href={tab.href}
              label={labels[tab.labelKey]}
              icon={tab.icon}
              active={tab.matches(pathname)}
            />
          ))}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-label={labels.more}
            aria-expanded={moreOpen}
            className={cn(
              "flex h-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
              inOverflow || moreOpen
                ? "text-[var(--dh-brand)]"
                : "text-muted-foreground",
            )}
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden />
            <span className="text-[length:var(--dh-text-2xs)] leading-none font-medium">
              {labels.more}
            </span>
          </button>
        </div>
      </nav>

      <Sheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        title={labels.more}
        desktop="full"
      >
        <div className="space-y-1">
          <SheetLink
            href={expenses.href}
            label={expenses.label}
            icon={expenses.icon}
            onNavigate={closeSheet}
          />
          <SheetLink
            href="/app/settings"
            label={labels.settings}
            icon={Settings}
            onNavigate={closeSheet}
          />
          {isAdmin ? (
            <SheetLink
              href="/admin"
              label="Admin"
              icon={Shield}
              onNavigate={closeSheet}
            />
          ) : null}

          <form action={signOut} className="pt-2">
            <FormSubmit variant="ghost" className="w-full justify-start px-3">
              {labels.signOut}
            </FormSubmit>
          </form>
        </div>
      </Sheet>
    </>
  );
}
