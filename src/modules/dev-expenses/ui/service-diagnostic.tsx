"use client";

import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  Gift,
  Sparkles,
  TriangleAlert,
  TrendingDown,
} from "lucide-react";
import {
  Badge,
  BulletList,
  Button,
  Card,
  Cluster,
  Heading,
  Stack,
  Text,
} from "@/design-system";
import type {
  AlternativeOption,
  ExpenseDiagnostic,
} from "@/modules/dev-expenses/types";
import { EFFORT_LABELS } from "@/modules/dev-expenses/types";
import { formatCurrencyCents } from "@/lib/numbers";
import { cn } from "@/lib/utils";

const VERDICT_TONE = {
  keep: "success",
  review: "warning",
  consider_switch: "danger",
} as const;

export function ServiceDiagnostic({
  serviceName,
  data,
  onClose,
}: {
  serviceName: string;
  data: ExpenseDiagnostic;
  onClose: () => void;
}) {
  return (
    <Card className="border-[var(--dh-brand)]/30 p-4">
      <Stack gap={3}>
        <Cluster gap={2} className="items-start justify-between">
          <div className="min-w-0">
            <Heading level={4}>Diagnostic — {serviceName}</Heading>
            <Text size="sm" tone="muted">
              {formatCurrencyCents(data.monthlySpendEur * 100)}/mois · {data.shareOfBudgetPct}% du
              budget
            </Text>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </Cluster>

        <div className="rounded-2xl border border-border bg-muted/30 p-3">
          <Cluster gap={1} className="flex-wrap">
            <Badge tone={VERDICT_TONE[data.verdict]}>{data.verdictLabel}</Badge>
            {data.source === "ai" ? (
              <Badge tone="brand">
                <Sparkles className="mr-1 inline h-3 w-3" />
                IA
              </Badge>
            ) : (
              <Badge tone="neutral">Catalogue local</Badge>
            )}
          </Cluster>
          <Text size="sm" className="mt-2 leading-relaxed break-words">
            {data.summary}
          </Text>
          {data.potentialSavingsEur != null && data.potentialSavingsEur > 0 ? (
            <Cluster gap={1} className="mt-2">
              <TrendingDown className="h-4 w-4 text-success" />
              <Text size="sm" weight="medium">
                Économie estimée : ~{data.potentialSavingsEur} €/mois
              </Text>
            </Cluster>
          ) : null}
        </div>

        {data.actions.length > 0 ? (
          <Stack gap={1}>
            <Text weight="medium">Quoi faire</Text>
            {data.actions.map((action) => (
              <Cluster key={action} gap={2} className="items-start">
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--dh-brand)]" />
                <Text size="sm" className="break-words">
                  {action}
                </Text>
              </Cluster>
            ))}
          </Stack>
        ) : null}

        {data.risks.length > 0 ? (
          <Stack gap={1}>
            <Text weight="medium">Ce que tu perds en changeant</Text>
            {data.risks.map((risk) => (
              <Cluster key={risk} gap={2} className="items-start">
                <TriangleAlert className="mt-1 h-4 w-4 shrink-0 text-warning" />
                <Text size="sm" tone="muted" className="break-words">
                  {risk}
                </Text>
              </Cluster>
            ))}
          </Stack>
        ) : null}

        {data.alternatives.length > 0 ? (
          <Stack gap={2}>
            <Text weight="medium">Alternatives pour le même usage</Text>
            {data.alternatives.map((alt) => (
              <AlternativeRow key={alt.slug} alt={alt} />
            ))}
          </Stack>
        ) : (
          <Text size="sm" tone="muted">
            Aucune alternative crédible identifiée pour ce service.
          </Text>
        )}
      </Stack>
    </Card>
  );
}

function AlternativeRow({ alt }: { alt: AlternativeOption }) {
  const [open, setOpen] = useState(false);
  const free = alt.typicalMonthlyEur === 0 || Boolean(alt.freeTier);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background/80">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left"
      >
        <span className="min-w-0">
          <Text weight="medium" className="break-words">
            {alt.name}
          </Text>
          <Cluster gap={1} className="mt-1 flex-wrap">
            <Badge tone={alt.typicalMonthlyEur === 0 ? "success" : "neutral"}>
              {alt.typicalMonthlyEur == null
                ? "Prix à l’usage"
                : alt.typicalMonthlyEur === 0
                  ? "Gratuit"
                  : `~${alt.typicalMonthlyEur} €/mois`}
            </Badge>
            <Badge tone="neutral">{EFFORT_LABELS[alt.migrationEffort]}</Badge>
          </Cluster>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div className="border-t border-border px-3 py-3">
          {free && alt.freeTier ? (
            <Cluster gap={2} className="mb-2 items-start">
              <Gift className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <Text size="sm" className="break-words">
                {alt.freeTier}
              </Text>
            </Cluster>
          ) : null}

          <Text size="sm" weight="medium">
            Avantages
          </Text>
          <div className="mt-1">
            <BulletList items={alt.pros} />
          </div>

          <Text size="sm" weight="medium" className="mt-2">
            Inconvénients
          </Text>
          <div className="mt-1">
            <BulletList items={alt.cons} />
          </div>

          <Text size="sm" tone="muted" className="mt-2 break-words">
            Idéal pour : {alt.bestFor}
          </Text>

          {alt.url ? (
            <a
              href={alt.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[length:var(--dh-text-sm)] font-medium text-[var(--dh-brand)]"
            >
              Voir les tarifs
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
