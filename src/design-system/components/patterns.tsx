import { type ReactNode } from "react";
import { type LucideIcon, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { Card } from "@/design-system/components/card";
import { Badge } from "@/design-system/components/feedback";
import { IconBox } from "@/design-system/components/primitives";
import { Cluster, Stack } from "@/design-system/components/layout";
import { Heading, Text } from "@/design-system/components/typography";
import { Button } from "@/design-system/components/button";

export function ModuleCard({
  href,
  title,
  description,
  icon,
  status,
  locked,
  ctaLabel,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status?: "active" | "coming_soon";
  locked?: boolean;
  ctaLabel: string;
}) {
  return (
    <Link href={href} className="block h-full cursor-pointer">
      <Card interactive className="h-full">
        <Cluster gap={3} align="start">
          <IconBox icon={icon} />
          <Stack gap={2} className="min-w-0 flex-1">
            <Cluster gap={2}>
              <Heading level={4}>{title}</Heading>
              {status === "coming_soon" ? (
                <Badge tone="warning">Coming soon</Badge>
              ) : null}
              {locked ? (
                <Badge tone="neutral">
                  <Lock className="h-3 w-3" />
                  Pro
                </Badge>
              ) : status === "active" ? (
                <Badge tone="success">Actif</Badge>
              ) : null}
            </Cluster>
            <Text size="sm" tone="muted">
              {description}
            </Text>
            <Text
              as="span"
              size="sm"
              weight="medium"
              tone="brand"
              className="inline-flex items-center gap-1"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Text>
          </Stack>
        </Cluster>
      </Card>
    </Link>
  );
}

export function PlanCard({
  title,
  price,
  description,
  active,
  action,
}: {
  title: string;
  price: string;
  description: string;
  active?: boolean;
  action?: ReactNode;
}) {
  return (
    <Card variant={active ? "accent" : "default"}>
      <Cluster gap={2} align="baseline" className="justify-between">
        <Heading level={4}>{title}</Heading>
        <Text as="span" size="sm" tone="muted" mono>
          {price}
        </Text>
      </Cluster>
      <Text size="sm" tone="muted" className="mt-[var(--dh-space-2)]">
        {description}
      </Text>
      <div className="mt-[var(--dh-space-4)]">
        {active ? (
          <Text size="sm" weight="medium" tone="brand">
            Plan actuel
          </Text>
        ) : (
          action
        )}
      </div>
    </Card>
  );
}

export function FeatureTeaser({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card variant="glass">
      <Heading level={4}>{title}</Heading>
      <Text size="sm" tone="muted" className="mt-[var(--dh-space-2)]">
        {description}
      </Text>
    </Card>
  );
}

export function FlagRow({
  title,
  description,
  actionLabel,
  action,
}: {
  title: string;
  description: string;
  actionLabel: string;
  action: () => void | Promise<void>;
}) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-[var(--dh-space-3)]">
      <div>
        <Text weight="medium">{title}</Text>
        <Text size="sm" tone="muted">
          {description}
        </Text>
      </div>
      <form action={action}>
        <Button type="submit" variant="secondary">
          {actionLabel}
        </Button>
      </form>
    </Card>
  );
}
