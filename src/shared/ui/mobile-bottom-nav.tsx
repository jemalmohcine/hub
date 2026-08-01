"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import {
  Briefcase,
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
    settings: string;
  };
};

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
      <div className="mx-auto grid h-[var(--dh-bottom-nav-h)] max-w-lg grid-cols-5 items-center gap-[var(--dh-space-1)] px-[var(--dh-space-2)]">
        <BottomNavItem
          href="/app/overview"
          label={labels.overview}
          icon={LayoutDashboard}
        />
        <BottomNavItem href="/app/ai" label={labels.ai} icon={Sparkles} />
        <BottomNavItem href="/app/cv" label={labels.cv} icon={FileText} />
        <BottomNavItem href="/app/jobs" label={labels.jobs} icon={Briefcase} />
        <BottomNavItem
          href="/app/settings"
          label={labels.settings}
          icon={Settings}
        />
      </div>
    </nav>,
    document.body,
  );
}
