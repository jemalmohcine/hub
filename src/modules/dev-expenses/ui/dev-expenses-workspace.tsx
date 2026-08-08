"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Loader2, PiggyBank, Plus, Sparkles, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Cluster,
  EmptyState,
  Field,
  Input,
  Stack,
  Text,
  useAsyncAction,
} from "@/design-system";
import {
  deleteDevExpenseService,
  diagnoseService,
  upsertMonthlyEntry,
} from "@/modules/dev-expenses/actions";
import { monthlyEquivalentCents } from "@/modules/dev-expenses/diagnose";
import { BudgetAnalysis } from "@/modules/dev-expenses/ui/budget-analysis";
import { ServiceDiagnostic } from "@/modules/dev-expenses/ui/service-diagnostic";
import { ServiceForm } from "@/modules/dev-expenses/ui/service-form";
import type {
  ExpenseDiagnostic,
  ServiceWithStats,
} from "@/modules/dev-expenses/types";
import { BILLING_LABELS, CATEGORY_LABELS } from "@/modules/dev-expenses/types";
import { formatDate, toMonthKey } from "@/lib/dates";
import { formatCurrencyCents } from "@/lib/numbers";
import { cn } from "@/lib/utils";

const formatEur = (cents: number) => formatCurrencyCents(cents);
const currentMonthLabel = () => formatDate(new Date(), "fr", "monthYear");

type Totals = {
  currentMonthCents: number;
  plannedMonthlyCents: number;
  ytdCents: number;
};

export function DevExpensesWorkspace({
  initialServices,
  totals,
}: {
  initialServices: ServiceWithStats[];
  totals: Totals;
}) {
  const [services, setServices] = useState(initialServices);
  const [showForm, setShowForm] = useState(false);
  const [diagnostic, setDiagnostic] = useState<{
    serviceId: string;
    data: ExpenseDiagnostic;
  } | null>(null);
  const [diagnosingId, setDiagnosingId] = useState<string | null>(null);
  const { run, pending } = useAsyncAction();

  const activeCount = useMemo(
    () => services.filter((s) => s.isActive).length,
    [services],
  );

  function handleLogMonth(service: ServiceWithStats, amountEur: string) {
    const amount = Number(amountEur);
    if (!Number.isFinite(amount)) return;

    void run(
      () =>
        upsertMonthlyEntry({
          serviceId: service.id,
          month: toMonthKey(),
          amountEur: amount,
        }),
      {
        success: "Montant du mois enregistré",
        error: "Impossible d’enregistrer",
        onSuccess: () => {
          const cents = Math.round(amount * 100);
          setServices((prev) =>
            prev.map((s) =>
              s.id === service.id
                ? {
                    ...s,
                    monthAmountCents: cents,
                    ytdTotalCents: s.ytdTotalCents + cents,
                    entryCount: s.entryCount + 1,
                  }
                : s,
            ),
          );
        },
      },
    );
  }

  function handleDelete(id: string) {
    setServices((prev) => prev.filter((s) => s.id !== id));
    if (diagnostic?.serviceId === id) setDiagnostic(null);
    void run(() => deleteDevExpenseService(id), {
      success: "Service supprimé",
      error: "Impossible de supprimer",
    });
  }

  function handleDiagnose(service: ServiceWithStats) {
    setDiagnosingId(service.id);
    void run(() => diagnoseService(service.id), {
      silent: true,
      error: "Le diagnostic a échoué",
      onSuccess: (data) => setDiagnostic({ serviceId: service.id, data }),
    }).finally(() => setDiagnosingId(null));
  }

  const diagnosedService = diagnostic
    ? services.find((s) => s.id === diagnostic.serviceId)
    : null;

  return (
    <Stack gap={4} className="pb-8">
      <GridSummary totals={totals} activeCount={activeCount} />

      <BudgetAnalysis serviceCount={activeCount} />

      <Cluster gap={2} className="justify-between">
        <Text size="sm" tone="muted">
          {services.length} service{services.length !== 1 ? "s" : ""} · {currentMonthLabel()}
        </Text>
        <Button type="button" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </Cluster>

      {showForm ? (
        <ServiceForm
          onCancel={() => setShowForm(false)}
          onCreated={(created) => {
            setServices((prev) => [
              { ...created, monthAmountCents: null, ytdTotalCents: 0, entryCount: 0 },
              ...prev,
            ]);
            setShowForm(false);
          }}
        />
      ) : null}

      {diagnostic && diagnosedService ? (
        <ServiceDiagnostic
          serviceName={diagnosedService.name}
          data={diagnostic.data}
          onClose={() => setDiagnostic(null)}
        />
      ) : null}

      <Stack gap={2}>
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            pending={pending}
            diagnosing={diagnosingId === service.id}
            onDelete={() => handleDelete(service.id)}
            onDiagnose={() => handleDiagnose(service)}
            onLogMonth={(amount) => handleLogMonth(service, amount)}
          />
        ))}
        {services.length === 0 ? (
          <EmptyState
            icon={PiggyBank}
            title="Aucun service suivi"
            hint="Ajoute tout ce que tu paies — l’IA reconnaît le provider, chiffre le poste et cherche les alternatives gratuites."
          />
        ) : null}
      </Stack>
    </Stack>
  );
}

function GridSummary({ totals, activeCount }: { totals: Totals; activeCount: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card className="p-4">
        <Text size="sm" tone="muted">
          Ce mois
        </Text>
        <Text className="text-2xl font-semibold tabular-nums">
          {formatEur(totals.currentMonthCents)}
        </Text>
      </Card>
      <Card className="p-4">
        <Text size="sm" tone="muted">
          Budget planifié / mois
        </Text>
        <Text className="text-2xl font-semibold tabular-nums">
          {formatEur(totals.plannedMonthlyCents)}
        </Text>
        <Text size="sm" tone="muted">
          {activeCount} services actifs
        </Text>
      </Card>
      <Card className="p-4">
        <Text size="sm" tone="muted">
          Cumul {new Date().getFullYear()}
        </Text>
        <Text className="text-2xl font-semibold tabular-nums">{formatEur(totals.ytdCents)}</Text>
      </Card>
    </div>
  );
}

function ServiceCard({
  service,
  pending,
  diagnosing,
  onDelete,
  onDiagnose,
  onLogMonth,
}: {
  service: ServiceWithStats;
  pending: boolean;
  diagnosing: boolean;
  onDelete: () => void;
  onDiagnose: () => void;
  onLogMonth: (amount: string) => void;
}) {
  const [monthInput, setMonthInput] = useState(
    String((service.monthAmountCents ?? monthlyEquivalentCents(service)) / 100),
  );

  const monthDisplay = formatEur(service.monthAmountCents ?? monthlyEquivalentCents(service));

  return (
    <Card className={cn("p-4", !service.isActive && "opacity-60")}>
      <Stack gap={2}>
        <Cluster gap={2} className="flex-wrap items-start justify-between">
          <div className="min-w-0">
            <Text weight="medium" className="break-words">
              {service.name}
            </Text>
            <Text size="sm" tone="muted">
              {CATEGORY_LABELS[service.category]} · {BILLING_LABELS[service.billingCycle]}
            </Text>
          </div>
          <Cluster gap={1} className="flex-wrap">
            <Badge tone="neutral">{monthDisplay}/mois</Badge>
            {service.ytdTotalCents > 0 ? (
              <Badge tone="info">YTD {formatEur(service.ytdTotalCents)}</Badge>
            ) : null}
          </Cluster>
        </Cluster>

        <Cluster gap={2} className="flex-wrap">
          <Field label="Montant réel ce mois (€)" htmlFor={`month-${service.id}`}>
            <Input
              id={`month-${service.id}`}
              type="number"
              min={0}
              step="0.01"
              className="max-w-[8rem]"
              value={monthInput}
              onChange={(e) => setMonthInput(e.target.value)}
            />
          </Field>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => onLogMonth(monthInput)}
          >
            Enregistrer le mois
          </Button>
        </Cluster>

        <Cluster gap={2} className="flex-wrap">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={diagnosing}
            onClick={onDiagnose}
          >
            {diagnosing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {diagnosing ? "Analyse…" : "Diagnostic & alternatives"}
          </Button>
          {service.websiteUrl ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => window.open(service.websiteUrl!, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="h-4 w-4" />
              Site
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive"
            disabled={pending}
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Cluster>
      </Stack>
    </Card>
  );
}
