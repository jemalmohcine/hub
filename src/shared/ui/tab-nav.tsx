import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabNavItem = {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
};

/**
 * URL-driven tabs for pages that host more than one workspace. Links rather
 * than local state, so each tab is deep-linkable and only fetches its own data.
 */
export function TabNav({
  items,
  active,
  label,
}: {
  items: TabNavItem[];
  active: string;
  label: string;
}) {
  return (
    <nav
      aria-label={label}
      className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const current = item.id === active;

        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[length:var(--dh-text-sm)] transition-colors",
              current
                ? "border-[var(--dh-brand)] bg-[var(--dh-brand)]/10 font-medium text-[var(--dh-brand)]"
                : "border-border text-muted-foreground",
            )}
          >
            {Icon ? <Icon className="h-4 w-4" aria-hidden /> : null}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
