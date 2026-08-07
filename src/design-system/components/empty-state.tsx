import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/design-system/lib/cn";
import { Card } from "@/design-system/components/card";
import { Heading, Text } from "@/design-system/components/typography";

export type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
  /** `card` for a standalone block, `inline` inside an existing card or column. */
  variant?: "card" | "inline";
  /** Tight padding for narrow slots such as a Kanban column. */
  dense?: boolean;
  className?: string;
};

/**
 * The one empty state for the whole app. Modules used to hand-roll five
 * different dashed cards; this keeps them visually identical.
 */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
  variant = "card",
  dense = false,
  className,
}: EmptyStateProps) {
  const body = (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        dense
          ? "gap-[var(--dh-space-2)] py-[var(--dh-space-3)]"
          : "gap-[var(--dh-space-3)] py-[var(--dh-space-6)]",
      )}
    >
      {Icon ? (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-[var(--dh-radius-xl)] bg-[var(--dh-bg-muted)] text-[var(--dh-fg-muted)]",
            dense ? "h-9 w-9" : "h-11 w-11",
          )}
          aria-hidden
        >
          <Icon className={dense ? "h-4 w-4" : "h-5 w-5"} />
        </span>
      ) : null}
      <div className="space-y-[var(--dh-space-1)]">
        <Heading
          level={3}
          className={cn(
            dense
              ? "text-[length:var(--dh-text-sm)] font-medium text-[var(--dh-fg-muted)]"
              : "text-[length:var(--dh-text-md)]",
          )}
        >
          {title}
        </Heading>
        {hint ? (
          <Text size="sm" tone="muted" className="mx-auto max-w-sm">
            {hint}
          </Text>
        ) : null}
      </div>
      {action}
    </div>
  );

  if (variant === "inline") {
    return <div className={className}>{body}</div>;
  }

  return (
    <Card className={cn("border-dashed bg-transparent shadow-none", className)}>
      {body}
    </Card>
  );
}
