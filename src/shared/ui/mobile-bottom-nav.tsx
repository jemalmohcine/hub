"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import {
  Briefcase,
  Code2,
  FileText,
  LayoutDashboard,
  Settings,
  Sparkles,
} from "lucide-react";
import { BottomNavItem } from "@/design-system";

const BOTTOM_NAV_HEIGHT_VAR = "--dh-bottom-nav-measured";

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

function syncBottomNavHeight(element: HTMLElement | null) {
  if (!element) return;
  document.documentElement.style.setProperty(
    BOTTOM_NAV_HEIGHT_VAR,
    `${element.offsetHeight}px`,
  );
}

export function MobileBottomNav({ labels }: MobileBottomNavProps) {
  const navRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const node = navRef.current;
    if (!node) return;

    syncBottomNavHeight(node);

    const observer = new ResizeObserver(() => {
      syncBottomNavHeight(node);
    });
    observer.observe(node);

    const onViewportChange = () => syncBottomNavHeight(node);
    window.visualViewport?.addEventListener("resize", onViewportChange);
    window.visualViewport?.addEventListener("scroll", onViewportChange);

    return () => {
      observer.disconnect();
      window.visualViewport?.removeEventListener("resize", onViewportChange);
      window.visualViewport?.removeEventListener("scroll", onViewportChange);
      document.documentElement.style.removeProperty(BOTTOM_NAV_HEIGHT_VAR);
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <nav
      ref={navRef}
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card shadow-[0_-4px_24px_rgba(0,0,0,0.12)] backdrop-blur supports-[backdrop-filter]:bg-card/95 lg:hidden"
      style={{
        paddingBottom: "var(--dh-safe-bottom)",
      }}
    >
      <div className="mx-auto flex min-h-[var(--dh-bottom-nav-h)] max-w-lg items-center gap-1 overflow-x-auto px-2 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.href} className="min-w-[4.25rem] shrink-0">
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
