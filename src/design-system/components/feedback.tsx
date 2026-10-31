import { type ReactNode } from "react";
import { Badge as UiBadge } from "@/components/ui/badge";
import {
  Alert as UiAlert,
  AlertDescription,
} from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";

const badgeVariant: Record<
  BadgeTone,
  "default" | "secondary" | "destructive" | "outline"
> = {
  brand: "default",
  neutral: "secondary",
  danger: "destructive",
  success: "outline",
  warning: "outline",
  info: "outline",
};

const badgeExtra: Partial<Record<BadgeTone, string>> = {
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  info: "border-info/30 bg-info/10 text-info",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <UiBadge
      variant={badgeVariant[tone]}
      className={cn("rounded-lg", badgeExtra[tone], className)}
    >
      {children}
    </UiBadge>
  );
}

export type AlertTone = "neutral" | "success" | "warning" | "danger" | "info";

const alertExtra: Record<AlertTone, string> = {
  neutral: "",
  danger: "",
  success: "border-success/30 text-success",
  warning: "border-warning/30 text-warning",
  info: "border-info/30 text-info",
};

export function Alert({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: AlertTone;
  className?: string;
}) {
  return (
    <UiAlert
      variant={tone === "danger" ? "destructive" : "default"}
      className={cn("rounded-xl", alertExtra[tone], className)}
    >
      <AlertDescription>{children}</AlertDescription>
    </UiAlert>
  );
}
