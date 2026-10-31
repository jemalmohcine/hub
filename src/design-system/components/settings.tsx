"use client";

import Link from "next/link";
import { useLinkStatus } from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Text, Heading } from "@/design-system/components/typography";
import { Badge } from "@/design-system/components/feedback";
import { Cluster, Stack } from "@/design-system/components/layout";
import { Card } from "@/design-system/components/card";

function LinkPendingHint({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <Loader2
      className={cn(
        "size-4 shrink-0 animate-spin text-primary transition-opacity duration-150",
        pending ? "opacity-100 delay-75" : "opacity-0",
        className,
      )}
      aria-hidden
    />
  );
}

export function SettingsBackLink({
  href = "/app/settings",
  label = "Settings",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
      <LinkPendingHint />
    </Link>
  );
}

export function SettingsAccountCard({
  name,
  email,
  plan,
  role,
}: {
  name: string;
  email: string;
  plan: string;
  role: string;
}) {
  const initial = (name || email || "?").charAt(0).toUpperCase();

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-4">
        <div
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground"
          aria-hidden
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <Cluster gap={2} className="mb-1">
            <Heading level={3} className="truncate !text-base sm:!text-lg">
              {name || "Sans nom"}
            </Heading>
            <Badge tone="brand" className="capitalize">
              {plan}
            </Badge>
          </Cluster>
          <Text size="sm" tone="muted" className="truncate">
            {email}
          </Text>
          <Text size="xs" tone="subtle" className="mt-0.5 capitalize">
            Rôle · {role}
          </Text>
        </div>
      </div>
    </Card>
  );
}

export function SettingsNavRow({
  href,
  title,
  description,
  icon,
  trailing,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  /** Pass rendered nodes (e.g. `<IconBox />`), not component refs — server → client safe. */
  icon?: ReactNode;
  trailing?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <Link href={href} className="group block cursor-pointer">
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border border-border bg-card p-4",
          "transition-[border-color,background-color,transform] duration-200",
          "hover:border-primary/35 hover:bg-muted/40 active:scale-[0.99]",
        )}
      >
        {icon}
        <div className="min-w-0 flex-1">
          <Cluster gap={2}>
            <Text as="p" weight="medium">
              {title}
            </Text>
            {badge}
          </Cluster>
          <Text as="p" size="sm" tone="muted" className="mt-0.5">
            {description}
          </Text>
        </div>
        <LinkPendingHint />
        {trailing}
      </div>
    </Link>
  );
}

export function SettingsSection({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Stack gap={3}>
      {(title || description) && (
        <div>
          {title ? <Heading level={3}>{title}</Heading> : null}
          {description ? (
            <Text size="sm" tone="muted" className="mt-1">
              {description}
            </Text>
          ) : null}
        </div>
      )}
      {children}
    </Stack>
  );
}

export function SettingsMetaRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-3 last:border-0">
      <Text size="sm" tone="muted">
        {label}
      </Text>
      <Text size="sm" weight="medium" className="text-right">
        {value}
      </Text>
    </div>
  );
}
