import Link from "next/link";
import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/design-system/lib/cn";
import {
  type ButtonSize,
  type ButtonVariant,
} from "@/design-system/components/button";
import { Text } from "@/design-system/components/typography";

export function BrandMark({
  size = "md",
  withWordmark = false,
  href = "/",
}: {
  size?: "sm" | "md" | "lg";
  withWordmark?: boolean;
  href?: string;
}) {
  const box = {
    sm: "h-8 w-8 rounded-[var(--dh-radius-md)] text-[length:var(--dh-text-xs)]",
    md: "h-9 w-9 rounded-[var(--dh-radius-lg)] text-[length:var(--dh-text-sm)]",
    lg: "h-11 w-11 rounded-[var(--dh-radius-lg)] text-[length:var(--dh-text-md)]",
  }[size];

  const content = (
    <>
      <span
        className={cn(
          "inline-flex items-center justify-center bg-[var(--dh-brand)] font-bold text-[var(--dh-brand-foreground)]",
          box,
        )}
      >
        H
      </span>
      {withWordmark ? (
        <span className="text-[length:var(--dh-text-lg)] font-semibold tracking-[var(--dh-tracking-tight)] text-[var(--dh-fg)]">
          DevHub
        </span>
      ) : null}
    </>
  );

  return (
    <Link href={href} className="inline-flex cursor-pointer items-center gap-[var(--dh-space-2)]">
      {content}
    </Link>
  );
}

export function IconBox({
  icon: Icon,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box = {
    sm: "h-8 w-8 rounded-[var(--dh-radius-md)]",
    md: "h-10 w-10 rounded-[var(--dh-radius-lg)]",
    lg: "h-12 w-12 rounded-[var(--dh-radius-xl)]",
  }[size];
  const iconSize = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" }[size];

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-[var(--dh-brand-soft)] text-[var(--dh-brand)]",
        box,
        className,
      )}
    >
      <Icon className={iconSize} />
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div>
      <Text as="p" size="xs" tone="muted" className="uppercase tracking-[var(--dh-tracking-wide)]">
        {label}
      </Text>
      <Text as="p" size="xl" weight="semibold" className="mt-[var(--dh-space-1)] capitalize">
        {value}
      </Text>
      {hint ? (
        <Text as="p" size="sm" tone="muted" className="mt-[var(--dh-space-1)]">
          {hint}
        </Text>
      ) : null}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-[var(--dh-space-6)] flex items-start justify-between gap-[var(--dh-space-4)]">
      <div>
        <h1 className="text-[length:var(--dh-text-2xl)] font-semibold tracking-[var(--dh-tracking-tight)] text-[var(--dh-fg)] sm:text-[length:var(--dh-text-3xl)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-[var(--dh-space-1)] text-[length:var(--dh-text-sm)] text-[var(--dh-fg-muted)] sm:text-[length:var(--dh-text-md)]">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-[var(--dh-brand)] text-[var(--dh-brand-foreground)] shadow-[var(--dh-shadow-sm)] hover:bg-[var(--dh-brand-hover)]",
    secondary:
      "bg-[var(--dh-bg-muted)] text-[var(--dh-fg)] border border-[var(--dh-border)] hover:border-[var(--dh-border-strong)]",
    ghost:
      "bg-transparent text-[var(--dh-fg-muted)] hover:bg-[var(--dh-bg-muted)] hover:text-[var(--dh-fg)]",
    danger:
      "bg-[var(--dh-danger-soft)] text-[var(--dh-danger)] hover:opacity-90",
    outline:
      "bg-transparent border border-[var(--dh-border)] text-[var(--dh-fg)] hover:border-[var(--dh-brand)] hover:text-[var(--dh-brand)]",
  };
  const sizes: Record<ButtonSize, string> = {
    sm: "h-9 px-3 text-[length:var(--dh-text-sm)] rounded-[var(--dh-radius-md)]",
    md: "h-11 px-4 text-[length:var(--dh-text-sm)] rounded-[var(--dh-radius-lg)]",
    lg: "h-12 px-5 text-[length:var(--dh-text-md)] rounded-[var(--dh-radius-lg)]",
  };

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 font-medium transition-[transform,opacity,background-color,border-color,color] duration-[var(--dh-duration)] ease-[var(--dh-ease)] active:scale-[0.98]",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function InlineLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="font-medium text-[var(--dh-brand)] hover:underline"
    >
      {children}
    </Link>
  );
}

export function Atmosphere({
  variant = "landing",
  className,
}: {
  variant?: "landing" | "module";
  className?: string;
}) {
  if (variant === "module") {
    return (
      <div
        className={cn(
          "mb-[var(--dh-space-5)] h-32 rounded-[var(--dh-radius-xl)]",
          className,
        )}
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--dh-brand) 35%, transparent), transparent 60%), radial-gradient(circle at 80% 20%, var(--dh-glow-strong), transparent 50%)",
        }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% -10%, var(--dh-glow-strong), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, var(--dh-glow), transparent)",
      }}
      aria-hidden
    />
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-[var(--dh-space-2)] text-[length:var(--dh-text-sm)] text-[var(--dh-fg-muted)]">
      {items.map((item) => (
        <li key={item} className="flex gap-[var(--dh-space-2)]">
          <span className="text-[var(--dh-brand)]" aria-hidden>
            •
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
