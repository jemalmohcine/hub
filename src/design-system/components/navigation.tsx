"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function LinkPendingHint() {
  const { pending } = useLinkStatus();
  return (
    <Loader2
      className={cn(
        "size-3.5 shrink-0 animate-spin text-primary transition-opacity duration-150",
        pending ? "opacity-100 delay-100" : "opacity-0",
      )}
      aria-hidden
    />
  );
}

export function NavItem({
  href,
  label,
  icon: Icon,
  active,
  trailing,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
        active
          ? "bg-accent font-medium text-accent-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{label}</span>
      <LinkPendingHint />
      {trailing}
    </Link>
  );
}

export function NavAction({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full cursor-pointer rounded-xl px-3 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}

export function BottomNavItem({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "relative flex cursor-pointer flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] transition-opacity",
        active ? "text-primary" : "text-muted-foreground",
      )}
    >
      <Icon className="size-5" />
      <span>{label}</span>
      <span className="absolute top-1.5 right-2">
        <LinkPendingHint />
      </span>
    </Link>
  );
}
