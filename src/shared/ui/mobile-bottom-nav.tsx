"use client";

import { Briefcase, LayoutDashboard, Settings, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { BottomNavItem } from "@/design-system";
import { cn } from "@/lib/utils";

type MobileBottomNavProps = {
  labels: {
    overview: string;
    ai: string;
    career: string;
    settings: string;
  };
  className?: string;
};

const NAV_ITEMS = [
  { href: "/app/overview", match: (path: string) => path.startsWith("/app/overview"), labelKey: "overview" as const, icon: LayoutDashboard },
  { href: "/app/ai", match: (path: string) => path.startsWith("/app/ai"), labelKey: "ai" as const, icon: Sparkles },
  {
    href: "/app/career",
    match: (path: string) =>
      path.startsWith("/app/career") ||
      path.startsWith("/app/cv") ||
      path.startsWith("/app/jobs"),
    labelKey: "career" as const,
    icon: Briefcase,
  },
  { href: "/app/settings", match: (path: string) => path.startsWith("/app/settings"), labelKey: "settings" as const, icon: Settings },
];

export function MobileBottomNav({ labels, className }: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className={cn(
        "border-t border-border bg-card shadow-[0_-4px_24px_rgba(0,0,0,0.08)]",
        className,
      )}
      style={{ paddingBottom: "var(--dh-safe-bottom)" }}
    >
      <div className="mx-auto grid h-[var(--dh-bottom-nav-h)] max-w-lg grid-cols-4 items-stretch px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <BottomNavItem
              key={item.href}
              href={item.href}
              label={labels[item.labelKey]}
              icon={Icon}
              active={active}
            />
          );
        })}
      </div>
    </nav>
  );
}
