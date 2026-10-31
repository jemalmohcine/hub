import { type ReactNode } from "react";
import {
  Card as UiCard,
  CardHeader as UiCardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type CardVariant = "default" | "muted" | "accent" | "ghost" | "glass";

const variants: Record<CardVariant, string> = {
  default: "",
  muted: "bg-muted",
  accent: "bg-accent ring-primary/30",
  ghost: "bg-transparent ring-0 shadow-none",
  glass: "bg-card/70 backdrop-blur",
};

export function Card({
  children,
  className,
  variant = "default",
  padding = "md",
  interactive,
}: {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
}) {
  const pad = {
    none: "py-0 [--card-spacing:0]",
    sm: "data-[size=sm]",
    md: "",
    lg: "[--card-spacing:--spacing(5)]",
  }[padding];

  return (
    <UiCard
      size={padding === "sm" ? "sm" : "default"}
      className={cn(
        variants[variant],
        pad,
        interactive && "transition-colors hover:ring-primary/30",
        className,
      )}
    >
      <CardContent className={padding === "none" ? "px-0" : undefined}>
        {children}
      </CardContent>
    </UiCard>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <UiCardHeader className="mb-4 px-0">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle>{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </div>
        {action}
      </div>
    </UiCardHeader>
  );
}
