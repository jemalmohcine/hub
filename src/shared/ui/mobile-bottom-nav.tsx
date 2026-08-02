"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import {
  Briefcase,
  Code2,
  FileText,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react";
import { BottomNavItem } from "@/design-system";

type MobileBottomNavProps = {
  labels: {
    overview: string;
    ai: string;
    cv: string;
    jobs: string;
    snippets: string;
    settings: string;
  };
};

const NAV_ITEMS = [
  { href: "/app/overview", labelKey: "overview" as const, icon: LayoutDashboard },
  { href: "/app/ai", labelKey: "ai" as const, icon: Sparkles },
  { href: "/app/cv", labelKey: "cv" as const, icon: FileText },
  { href: "/app/jobs", labelKey: "jobs" as const, icon: Briefcase },
  { href: "/app/snippets", labelKey: "snippets" as const, icon: Code2 },
  { href: "/app/settings", labelKey: "settings" as const, icon: Settings },
];

export function MobileBottomNav({ labels }: MobileBottomNavProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 lg:hidden"
      style={{
        paddingBottom: "var(--dh-safe-bottom)",
      }}
    >
      <div className="mx-auto flex h-[var(--dh-bottom-nav-h)] max-w-lg items-stretch gap-1 overflow-x-auto px-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.href} className="min-w-[4.5rem] shrink-0">
              <BottomNavItem
                href={item.href}
                label={labels[item.labelKey]}
                icon={Icon}
              />
            </div>
          );
        })}
      </div>
    </nav>,
    document.body,
  );
}
