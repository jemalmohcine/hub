import { type ReactNode } from "react";
import { cn } from "@/design-system/lib/cn";

export function Stack({
  gap = 4,
  className,
  children,
}: {
  gap?: 1 | 2 | 3 | 4 | 5 | 6 | 8;
  className?: string;
  children: ReactNode;
}) {
  const gaps: Record<number, string> = {
    1: "gap-[var(--dh-space-1)]",
    2: "gap-[var(--dh-space-2)]",
    3: "gap-[var(--dh-space-3)]",
    4: "gap-[var(--dh-space-4)]",
    5: "gap-[var(--dh-space-5)]",
    6: "gap-[var(--dh-space-6)]",
    8: "gap-[var(--dh-space-8)]",
  };
  return (
    <div className={cn("flex flex-col", gaps[gap], className)}>{children}</div>
  );
}

export function Cluster({
  gap = 2,
  align = "center",
  className,
  children,
}: {
  gap?: 1 | 2 | 3 | 4;
  align?: "start" | "center" | "end" | "baseline";
  className?: string;
  children: ReactNode;
}) {
  const gaps: Record<number, string> = {
    1: "gap-[var(--dh-space-1)]",
    2: "gap-[var(--dh-space-2)]",
    3: "gap-[var(--dh-space-3)]",
    4: "gap-[var(--dh-space-4)]",
  };
  const aligns = {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    baseline: "items-baseline",
  };
  return (
    <div className={cn("flex flex-wrap", gaps[gap], aligns[align], className)}>
      {children}
    </div>
  );
}

export function Grid({
  cols = 1,
  gap = 3,
  className,
  children,
}: {
  cols?: 1 | 2 | 3;
  gap?: 2 | 3 | 4;
  className?: string;
  children: ReactNode;
}) {
  const colClass = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-3",
  }[cols];
  const gapClass = {
    2: "gap-[var(--dh-space-2)]",
    3: "gap-[var(--dh-space-3)]",
    4: "gap-[var(--dh-space-4)]",
  }[gap];
  return (
    <div className={cn("grid", colClass, gapClass, className)}>{children}</div>
  );
}

export function Container({
  size = "content",
  className,
  children,
}: {
  size?: "content" | "auth" | "full";
  className?: string;
  children: ReactNode;
}) {
  const max = {
    content: "max-w-[var(--dh-content-max)]",
    auth: "max-w-[var(--dh-auth-max)]",
    full: "max-w-none",
  }[size];
  return (
    <div className={cn("mx-auto w-full px-[var(--dh-space-4)]", max, className)}>
      {children}
    </div>
  );
}

export function Spacer({ size = 4 }: { size?: 2 | 3 | 4 | 6 | 8 | 12 }) {
  const map: Record<number, string> = {
    2: "h-[var(--dh-space-2)]",
    3: "h-[var(--dh-space-3)]",
    4: "h-[var(--dh-space-4)]",
    6: "h-[var(--dh-space-6)]",
    8: "h-[var(--dh-space-8)]",
    12: "h-[var(--dh-space-12)]",
  };
  return <div className={map[size]} aria-hidden />;
}

export function Divider({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  if (!label) {
    return (
      <hr
        className={cn(
          "border-0 border-t border-[var(--dh-border)]",
          className,
        )}
      />
    );
  }
  return (
    <div className={cn("relative py-[var(--dh-space-2)] text-center", className)}>
      <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--dh-border)]" />
      <span className="relative z-10 bg-[var(--dh-bg-elevated)] px-[var(--dh-space-2)] text-[length:var(--dh-text-xs)] text-[var(--dh-fg-muted)]">
        {label}
      </span>
    </div>
  );
}
