"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ExternalLink,
  Loader2,
  PiggyBank,
  Plus,
  Sparkles,
  Trash2,
  TrendingDown,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Cluster,
  Field,
  Heading,
  Input,
  Select,
  Stack,
  Text,
  Textarea,
  useAsyncAction,
} from "@/design-system";
import {
  createDevExpenseService,
  deleteDevExpenseService,
  upsertMonthlyEntry,
} from "@/modules/dev-expenses/actions";
import {
  diagnoseService,
  KNOWN_PROVIDERS,
  monthlyEquivalentCents,
} from "@/modules/dev-expenses/alternatives";
import type {
  ExpenseCategory,
  ExpenseDiagnostic,
  ServiceWithStats,
} from "@/modules/dev-expenses/types";
import { BILLING_LABELS, CATEGORY_LABELS } from "@/modules/dev-expenses/types";
import { cn } from "@/lib/utils";

function formatEur(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function currentMonthLabel(): string {
  return new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function currentMonthValue(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as ExpenseCategory[];

const EMPTY_FORM = {
  name: "",
  providerSlug: "",
  category: "saas" as ExpenseCategory,
  billingCycle: "monthly" as const,
  plannedAmountEur: "",
  websiteUrl: "",
  notes: "",
};

export function DevExpensesWorkspace({
  initialServices,
  totals,
}: {
  initialServices: ServiceWithStats[];
  totals: { currentMonthCents: number; plannedMonthlyCents: number; ytdCents: number };
}) {
  const [services, setServices] = useState(initialServices);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [diagnostic, setDiagnostic] = useState<{
    service: ServiceWithStats;
    data: ExpenseDiagnostic;
  } | null>(null);
  const { run, pending } = useAsyncAction();

  const activeServices = useMemo(
    () => services.filter((s) => s.isActive),
    [services],
  );

  function handleCreate() {
    const amount = Number(form.plannedAmountEur);
    if (!form.name.trim() || !Number.isFinite(amount)) return;

    void run(
      () =>
        createDevExpenseService({
          name: form.name,
          providerSlug: form.providerSlug || null,
          category: form.category,
          billingCycle: form.billingCycle,
          plannedAmountEur: amount,
          websiteUrl: form.websiteUrl || null,
          notes: form.notes || null,
        }),
      {
        success: "Service ajouté",
        error: "Impossible d’ajouter le service",
        onSuccess: (created) => {
          setServices((prev) => [
            { ...created, monthAmountCents: null, ytdTotalCents: 0, entryCount: 0 },
            ...prev,
          ]);
          setForm(EMPTY_FORM);
          setShowForm(false);
        },
      },
    );
  }

  function handleLogMonth(service: ServiceWithStats, amountEur: string) {
    const amount = Number(amountEur);
    if (!Number.isFinite(amount)) return;

    void run(
      () =>
        upsertMonthlyEntry({
          serviceId: service.id,
          month: currentMonthValue(),
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
    void run(() => deleteDevExpenseService(id), {
      success: "Service supprimé",
      error: "Impossible de supprimer",
    });
  }

  function openDiagnostic(service: ServiceWithStats) {
    const actual =
      service.monthAmountCents ?? monthlyEquivalentCents(service);
    const data = diagnoseService(service, actual, totals.currentMonthCents);
    setDiagnostic({ service, data });
  }

  return (
    <Stack gap={4} className="pb-8">
      <GridSummary totals={totals} activeCount={activeServices.length} />

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
        <Card className="p-4">
          <Stack gap={3}>
            <Heading level={4}>Nouveau service / outil</Heading>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nom" htmlFor="exp-name">
                <Input
                  id="exp-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="OpenAI API, Vercel Pro…"
                />
              </Field>
              <Field label="Provider (optionnel)" htmlFor="exp-provider">
                <Select
                  id="exp-provider"
                  value={form.providerSlug}
                  onChange={(e) => setForm({ ...form, providerSlug: e.target.value })}
                >
                  <option value="">— Autre —</option>
                  {KNOWN_PROVIDERS.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Catégorie" htmlFor="exp-cat">
                <Select
                  id="exp-cat"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value as ExpenseCategory })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Facturation" htmlFor="exp-billing">
                <Select
                  id="exp-billing"
                  value={form.billingCycle}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      billingCycle: e.target.value as typeof form.billingCycle,
                    })
                  }
                >
                  {Object.entries(BILLING_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Montant (€)" htmlFor="exp-amount">
                <Input
                  id="exp-amount"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.plannedAmountEur}
                  onChange={(e) => setForm({ ...form, plannedAmountEur: e.target.value })}
                  placeholder="29"
                />
              </Field>
            </div>
            <Field label="URL" htmlFor="exp-url">
              <Input
                id="exp-url"
                value={form.websiteUrl}
                onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                placeholder="https://…"
              />
            </Field>
            <Field label="Notes" htmlFor="exp-notes">
              <Textarea
                id="exp-notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
            <Cluster gap={2}>
              <Button
                type="button"
                disabled={pending || !form.name.trim()}
                onClick={handleCreate}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enregistrer
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Annuler
              </Button>
            </Cluster>
          </Stack>
        </Card>
      ) : null}

      <Stack gap={2}>
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            pending={pending}
            onDelete={() => handleDelete(service.id)}
            onDiagnose={() => openDiagnostic(service)}
            onLogMonth={(amount) => handleLogMonth(service, amount)}
          />
        ))}
        {services.length === 0 ? (
          <Card className="border-dashed p-8 text-center">
            <PiggyBank className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <Text size="sm" tone="muted">
              Ajoute Vercel, OpenAI, Supabase… pour suivre ton budget dev et comparer les
              alternatives.
            </Text>
          </Card>
        ) : null}
      </Stack>

      {diagnostic ? (
        <DiagnosticPanel
          service={diagnostic.service}
          data={diagnostic.data}
          onClose={() => setDiagnostic(null)}
        />
      ) : null}
    </Stack>
  );
}

function GridSummary({
  totals,
  activeCount,
}: {
  totals: { currentMonthCents: number; plannedMonthlyCents: number; ytdCents: number };
  activeCount: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card className="p-4">
        <Text size="sm" tone="muted">Ce mois</Text>
        <Text className="text-2xl font-semibold tabular-nums">
          {formatEur(totals.currentMonthCents)}
        </Text>
      </Card>
      <Card className="p-4">
        <Text size="sm" tone="muted">Budget planifié / mois</Text>
        <Text className="text-2xl font-semibold tabular-nums">
          {formatEur(totals.plannedMonthlyCents)}
        </Text>
        <Text size="sm" tone="muted">{activeCount} services actifs</Text>
      </Card>
      <Card className="p-4">
        <Text size="sm" tone="muted">Cumul {new Date().getFullYear()}</Text>
        <Text className="text-2xl font-semibold tabular-nums">
          {formatEur(totals.ytdCents)}
        </Text>
      </Card>
    </div>
  );
}

function ServiceCard({
  service,
  pending,
  onDelete,
  onDiagnose,
  onLogMonth,
}: {
  service: ServiceWithStats;
  pending: boolean;
  onDelete: () => void;
  onDiagnose: () => void;
  onLogMonth: (amount: string) => void;
}) {
  const [monthInput, setMonthInput] = useState(
    service.monthAmountCents != null
      ? String(service.monthAmountCents / 100)
      : String(monthlyEquivalentCents(service) / 100),
  );

  const monthDisplay =
    service.monthAmountCents != null
      ? formatEur(service.monthAmountCents)
      : formatEur(monthlyEquivalentCents(service));

  return (
    <Card className={cn("p-4", !service.isActive && "opacity-60")}>
      <Stack gap={2}>
        <Cluster gap={2} className="flex-wrap items-start justify-between">
          <div className="min-w-0">
            <Text weight="medium">{service.name}</Text>
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
          <Button type="button" size="sm" variant="secondary" onClick={onDiagnose}>
            <Sparkles className="h-4 w-4" />
            Diagnostic & alternatives
          </Button>
          {service.websiteUrl ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                window.open(service.websiteUrl!, "_blank", "noopener,noreferrer")
              }
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

function DiagnosticPanel({
  service,
  data,
  onClose,
}: {
  service: ServiceWithStats;
  data: ExpenseDiagnostic;
  onClose: () => void;
}) {
  const tone =
    data.verdict === "consider_switch"
      ? "danger"
      : data.verdict === "review"
        ? "warning"
        : "success";

  return (
    <Card className="border-[var(--dh-brand)]/30 p-4">
      <Stack gap={3}>
        <Cluster gap={2} className="justify-between">
          <div>
            <Heading level={4}>Diagnostic — {service.name}</Heading>
            <Text size="sm" tone="muted">
              {formatEur(data.monthlySpendEur * 100)}/mois · {data.shareOfBudgetPct}% du budget
            </Text>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Fermer
          </Button>
        </Cluster>

        <div className="rounded-2xl border border-border bg-muted/30 p-3">
          <Badge tone={tone}>{data.verdictLabel}</Badge>
          <Text size="sm" className="mt-2 leading-relaxed">{data.summary}</Text>
          {data.potentialSavingsEur != null && data.potentialSavingsEur > 0 ? (
            <Cluster gap={1} className="mt-2">
              <TrendingDown className="h-4 w-4 text-[var(--dh-success)]" />
              <Text size="sm" weight="medium">
                Économie potentielle : ~{data.potentialSavingsEur} €/mois
              </Text>
            </Cluster>
          ) : null}
        </div>

        {data.alternatives.length > 0 ? (
          <Stack gap={2}>
            <Text weight="medium">Alternatives moins chères (même usage)</Text>
            {data.alternatives.map((alt) => (
              <AlternativeCard key={alt.slug} alt={alt} />
            ))}
          </Stack>
        ) : (
          <Text size="sm" tone="muted">
            Pas d’alternative cataloguée pour ce provider — ajoute un slug connu (vercel, openai,
            supabase…) pour des suggestions.
          </Text>
        )}
      </Stack>
    </Card>
  );
}

function AlternativeCard({
  alt,
}: {
  alt: ExpenseDiagnostic["alternatives"][number];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-background/80">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left"
      >
        <span>
          <Text weight="medium">{alt.name}</Text>
          {alt.typicalMonthlyEur != null ? (
            <Text size="sm" tone="muted">
              ~{alt.typicalMonthlyEur} €/mois
            </Text>
          ) : (
            <Text size="sm" tone="muted">Prix variable / usage</Text>
          )}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="border-t border-border px-3 py-3 text-sm">
          <Text size="sm" weight="medium">Avantages</Text>
          <ul className="mt-1 list-inside list-disc text-muted-foreground">
            {alt.pros.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <Text size="sm" weight="medium" className="mt-2">Inconvénients</Text>
          <ul className="mt-1 list-inside list-disc text-muted-foreground">
            {alt.cons.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <Text size="sm" tone="muted" className="mt-2">
            Idéal pour : {alt.bestFor}
          </Text>
        </div>
      ) : null}
    </div>
  );
}
