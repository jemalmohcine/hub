import { type ReactNode } from "react";
import { cn } from "@/design-system/lib/cn";

export type TextTone = "default" | "muted" | "subtle" | "brand" | "danger" | "success" | "warning" | "inverse";
export type TextSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
export type TextWeight = "regular" | "medium" | "semibold" | "bold";

const toneClass: Record<TextTone, string> = {
  default: "text-[var(--dh-fg)]",
  muted: "text-[var(--dh-fg-muted)]",
  subtle: "text-[var(--dh-fg-subtle)]",
  brand: "text-[var(--dh-brand)]",
  danger: "text-[var(--dh-danger)]",
  success: "text-[var(--dh-success)]",
  warning: "text-[var(--dh-warning)]",
  inverse: "text-[var(--dh-fg-inverse)]",
};

const sizeClass: Record<TextSize, string> = {
  xs: "text-[length:var(--dh-text-xs)]",
  sm: "text-[length:var(--dh-text-sm)]",
  md: "text-[length:var(--dh-text-md)]",
  lg: "text-[length:var(--dh-text-lg)]",
  xl: "text-[length:var(--dh-text-xl)]",
  "2xl": "text-[length:var(--dh-text-2xl)]",
  "3xl": "text-[length:var(--dh-text-3xl)]",
  "4xl": "text-[length:var(--dh-text-4xl)]",
  "5xl": "text-[length:var(--dh-text-5xl)]",
};

const weightClass: Record<TextWeight, string> = {
  regular: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

type TextProps = {
  as?: "p" | "span" | "div" | "label";
  tone?: TextTone;
  size?: TextSize;
  weight?: TextWeight;
  mono?: boolean;
  className?: string;
  children: ReactNode;
};

export function Text({
  as: Comp = "p",
  tone = "default",
  size = "md",
  weight = "regular",
  mono,
  className,
  children,
}: TextProps) {
  return (
    <Comp
      className={cn(
        toneClass[tone],
        sizeClass[size],
        weightClass[weight],
        mono && "font-mono",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

type HeadingLevel = 1 | 2 | 3 | 4;

const headingTag: Record<HeadingLevel, "h1" | "h2" | "h3" | "h4"> = {
  1: "h1",
  2: "h2",
  3: "h3",
  4: "h4",
};

const headingSize: Record<HeadingLevel, string> = {
  1: "text-[length:var(--dh-text-3xl)] sm:text-[length:var(--dh-text-4xl)] tracking-[var(--dh-tracking-tight)] leading-[var(--dh-leading-tight)]",
  2: "text-[length:var(--dh-text-xl)] sm:text-[length:var(--dh-text-2xl)] tracking-[var(--dh-tracking-tight)]",
  3: "text-[length:var(--dh-text-lg)]",
  4: "text-[length:var(--dh-text-md)]",
};

export function Heading({
  level = 2,
  className,
  children,
}: {
  level?: HeadingLevel;
  className?: string;
  children: ReactNode;
}) {
  const Comp = headingTag[level];
  return (
    <Comp
      className={cn(
        "font-semibold text-[var(--dh-fg)]",
        headingSize[level],
        className,
      )}
    >
      {children}
    </Comp>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-mono text-[length:var(--dh-text-xs)] uppercase tracking-[var(--dh-tracking-wider)] text-[var(--dh-brand)]",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function Code({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <code
      className={cn(
        "rounded-[var(--dh-radius-sm)] bg-[var(--dh-bg-muted)] px-1.5 py-0.5 font-mono text-[length:var(--dh-text-xs)] text-[var(--dh-fg)]",
        className,
      )}
    >
      {children}
    </code>
  );
}
