"use client";

import { useState } from "react";
import {
  ArrowRight,
  BadgeEuro,
  Copy,
  Gift,
  Loader2,
  Sparkles,
  ThumbsUp,
  TriangleAlert,
  Wallet,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Cluster,
  Heading,
  Stack,
  Text,
  useAsyncAction,
} from "@/design-system";
import { diagnoseBudget } from "@/modules/dev-expenses/actions";
import type {
  BudgetDiagnostic,
  BudgetFinding,
  BudgetFindingKind,
} from "@/modules/dev-expenses/types";
import { EFFORT_LABELS, FINDING_LABELS } from "@/modules/dev-expenses/types";
import { cn } from "@/lib/utils";

const FINDING_ICON: Record<BudgetFindingKind, LucideIcon> = {
  duplicate: Copy,
  overpriced: BadgeEuro,
  free_alternative: Gift,
  underused: TriangleAlert,
  consolidation: Wallet,
  healthy: ThumbsUp,
};

const FINDING_TONE: Record<BudgetFindingKind, "danger" | "warning" | "success" | "info"> = {
  duplicate: "danger",
  overpriced: "warning",
  free_alternative: "success",
  underused: "warning",
  consolidation: "info",
  healthy: "success",
};

export function BudgetAnalysis({ serviceCount }: { serviceCount: number }) {
  const [report, setReport] = useState<BudgetDiagnostic | null>(null);
  const { run, pending } = useAsyncAction();

  function analyse() {
    void run(() => diagnoseBudget(), {
      silent: true,
      error: "L’analyse du budget a échoué",
      onSuccess: setReport,
    });
  }

  if (serviceCount === 0) return null;

  return (
    <Card className="border-[var(--dh-brand)]/30 p-4">
      <Stack gap={3}>
        <Cluster gap={2} className="items-start justify-between">
          <div className="min-w-0">
            <Cluster gap={2} className="items-center">
              <Sparkles className="h-4 w-4 shrink-0 text-[var(--dh-brand)]" />
              <Heading level={4}>Analyse du budget</Heading>
            </Cluster>
            <Text size="sm" tone="muted">
              Doublons, plans gratuits que tu paies, postes qui dérapent — sur tes{" "}
              {serviceCount} service{serviceCount > 1 ? "s" : ""}.
            </Text>
          </div>
          <Button type="button" size="sm" disabled={pending} onClick={analyse}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {report ? "Relancer" : "Analyser"}
          </Button>
        </Cluster>

        {report ? <BudgetReport report={report} /> : null}
      </Stack>
    </Card>
  );
}

function BudgetReport({ report }: { report: BudgetDiagnostic }) {
  return (
    <Stack gap={3}>
      <div className="rounded-2xl border border-border bg-muted/30 p-3">
        <Cluster gap={1} className="flex-wrap">
          <Badge tone={report.monthlySavingsEur > 0 ? "success" : "neutral"}>
            {report.headline}
          </Badge>
          <Badge tone={report.source === "ai" ? "brand" : "neutral"}>
            {report.source === "ai" ? "IA" : "Catalogue local"}
          </Badge>
        </Cluster>

        <Text size="sm" className="mt-2 leading-relaxed break-words">
          {report.summary}
        </Text>

        <HealthBar score={report.healthScore} />
      </div>

      {report.quickWins.length > 0 ? (
        <Stack gap={1}>
          <Cluster gap={2} className="items-center">
            <Zap className="h-4 w-4 text-success" />
            <Text weight="medium">À faire maintenant, sans migration</Text>
          </Cluster>
          {report.quickWins.map((win) => (
            <Cluster key={win} gap={2} className="items-start">
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--dh-brand)]" />
              <Text size="sm" className="break-words">
                {win}
              </Text>
            </Cluster>
          ))}
        </Stack>
      ) : null}

      <Stack gap={2}>
        {report.findings.map((finding) => (
          <FindingCard key={`${finding.kind}-${finding.title}`} finding={finding} />
        ))}
      </Stack>
    </Stack>
  );
}

function HealthBar({ score }: { score: number }) {
  const tone =
    score >= 75 ? "bg-success" : score >= 45 ? "bg-warning" : "bg-destructive";

  return (
    <div className="mt-3">
      <Cluster gap={2} className="justify-between">
        <Text size="sm" tone="muted">
          Santé du budget
        </Text>
        <Text size="sm" weight="medium" className="tabular-nums">
          {score}/100
        </Text>
      </Cluster>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function FindingCard({ finding }: { finding: BudgetFinding }) {
  const Icon = FINDING_ICON[finding.kind];

  return (
    <div className="rounded-2xl border border-border bg-background/80 p-3">
      <Cluster gap={2} className="items-start">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--dh-brand)]" />
        <div className="min-w-0 flex-1">
          <Text weight="medium" className="break-words">
            {finding.title}
          </Text>

          <Cluster gap={1} className="mt-1 flex-wrap">
            <Badge tone={FINDING_TONE[finding.kind]}>{FINDING_LABELS[finding.kind]}</Badge>
            {finding.monthlySavingsEur != null && finding.monthlySavingsEur > 0 ? (
              <Badge tone="success">−{Math.round(finding.monthlySavingsEur)} €/mois</Badge>
            ) : null}
            <Badge tone="neutral">{EFFORT_LABELS[finding.effort]}</Badge>
          </Cluster>

          <Text size="sm" tone="muted" className="mt-2 leading-relaxed break-words">
            {finding.detail}
          </Text>

          {finding.recommendation ? (
            <Cluster gap={2} className="mt-2 items-start">
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--dh-brand)]" />
              <Text size="sm" className="break-words">
                {finding.recommendation}
              </Text>
            </Cluster>
          ) : null}

          {finding.services.length > 0 ? (
            <Cluster gap={1} className="mt-2 flex-wrap">
              {finding.services.map((name) => (
                <Badge key={name} tone="neutral">
                  {name}
                </Badge>
              ))}
            </Cluster>
          ) : null}
        </div>
      </Cluster>
    </div>
  );
}
