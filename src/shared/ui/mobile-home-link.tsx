"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { cn } from "@/design-system/lib/cn";

/** Quick return to overview on small screens (every in-app page). */
export function MobileHomeLink({ className }: { className?: string }) {
  const pathname = usePathname();
  const onOverview =
    pathname === "/app/overview" || pathname.startsWith("/app/overview/");

  return (
    <Link
      href="/app/overview"
      aria-label="Retour à l’accueil"
      aria-current={onOverview ? "page" : undefined}
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none lg:hidden",
        onOverview
          ? "bg-[var(--dh-brand-soft)] text-[var(--dh-brand)]"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <Home className="h-5 w-5" aria-hidden />
    </Link>
  );
}
