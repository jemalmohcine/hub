import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";
import { getModule } from "@/core/module-registry";
import { Badge, Card, Heading, Stack, Text } from "@/design-system";
import { cn } from "@/design-system/lib/cn";
import { aiIntelInboxHref } from "@/modules/ai-intel/item-link";
import type { TodayDigest, TodaySignal, TodayTone } from "@/modules/today/types";

const TONE_ACCENT: Record<TodayTone, string> = {
  urgent: "bg-[var(--dh-danger-soft)] text-[var(--dh-danger)]",
  attention: "bg-[var(--dh-warning-soft)] text-[var(--dh-warning)]",
  neutral: "bg-[var(--dh-brand-soft)] text-[var(--dh-brand)]",
};

function SignalRow({ signal }: { signal: TodaySignal }) {
  const Icon = getModule(signal.module).icon;

  return (
    <Link
      href={signal.href}
      className="flex items-center gap-3 rounded-2xl border border-border px-3 py-3 transition-colors hover:border-[var(--dh-border-strong)] focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          TONE_ACCENT[signal.tone],
        )}
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <Text as="span" size="sm" weight="semibold" className="block">
          {signal.label}
        </Text>
        <Text as="span" size="sm" tone="muted" className="block truncate">
          {signal.detail}
        </Text>
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </Link>
  );
}

/**
 * The first thing a developer sees each morning: what changed and what to act on.
 * Deliberately short — anything longer than a screen kills the daily habit.
 */
export function TodayBoard({ digest }: { digest: TodayDigest }) {
  const hasActions = digest.signals.length > 0;

  return (
    <Stack gap={4}>
      {hasActions ? (
        <Card>
          <div className="mb-3 flex items-center justify-between gap-3">
            <Heading level={3}>À traiter</Heading>
            {digest.allClear ? (
              <Badge tone="success">Rien d’urgent</Badge>
            ) : (
              <Badge tone="danger">Action requise</Badge>
            )}
          </div>
          <Stack gap={2}>
            {digest.signals.map((signal) => (
              <SignalRow key={signal.id} signal={signal} />
            ))}
          </Stack>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--dh-success-soft)] text-[var(--dh-success)]"
              aria-hidden
            >
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <Heading level={3}>Rien d’urgent aujourd’hui</Heading>
              <Text size="sm" tone="muted">
                Aucune alerte, aucune relance en attente. Reviens demain.
              </Text>
            </div>
          </div>
        </Card>
      )}

      {digest.highlights.length > 0 ? (
        <Card>
          <div className="mb-3 flex items-center justify-between gap-3">
            <Heading level={3}>Alertes non traitées</Heading>
            <Link
              href={aiIntelInboxHref()}
              className="inline-flex items-center gap-1 text-[length:var(--dh-text-sm)] font-medium text-[var(--dh-brand)] hover:underline"
            >
              Tout voir
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          <Stack gap={2}>
            {digest.highlights.map((highlight) => (
              <Link
                key={highlight.id}
                href={highlight.href}
                className="block rounded-2xl bg-muted/40 px-3 py-2.5 transition-colors hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <Text as="span" size="sm" weight="medium" className="line-clamp-2 block">
                  {highlight.title}
                </Text>
                <Text as="span" size="2xs" tone="muted" className="mt-0.5 block uppercase tracking-wide">
                  {highlight.source}
                </Text>
              </Link>
            ))}
          </Stack>
        </Card>
      ) : null}
    </Stack>
  );
}
