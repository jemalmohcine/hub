"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Gift, Loader2, Sparkles, X } from "lucide-react";
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
import { createDevExpenseService, suggestProvider } from "@/modules/dev-expenses/actions";
import type {
  BillingCycle,
  DevExpenseService,
  ExpenseCategory,
  ProviderSuggestion,
} from "@/modules/dev-expenses/types";
import {
  BILLING_LABELS,
  CATEGORY_LABELS,
  EXPENSE_CATEGORIES,
} from "@/modules/dev-expenses/types";

/** How long the user has to stop typing before we ask the model who this is. */
const DETECT_DEBOUNCE_MS = 700;

type FormState = {
  name: string;
  providerSlug: string;
  category: ExpenseCategory;
  billingCycle: BillingCycle;
  plannedAmountEur: string;
  websiteUrl: string;
  notes: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  providerSlug: "",
  category: "saas",
  billingCycle: "monthly",
  plannedAmountEur: "",
  websiteUrl: "",
  notes: "",
};

export function ServiceForm({
  onCreated,
  onCancel,
}: {
  onCreated: (service: DevExpenseService) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [suggestion, setSuggestion] = useState<ProviderSuggestion | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [manual, setManual] = useState(false);
  const { run, pending } = useAsyncAction();

  /** Fields the user edited by hand — detection never overwrites those. */
  const touched = useRef(new Set<keyof FormState>());
  const lastQuery = useRef("");

  function patch<K extends keyof FormState>(field: K, value: FormState[K]) {
    touched.current.add(field);
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    const name = form.name.trim();
    if (name.length < 3 || name === lastQuery.current) return;

    const timer = setTimeout(() => {
      lastQuery.current = name;
      setDetecting(true);

      void suggestProvider({
        name,
        websiteUrl: form.websiteUrl || null,
        notes: form.notes || null,
        amountEur: Number(form.plannedAmountEur) || null,
      })
        .then((result) => {
          if (!result) {
            setSuggestion(null);
            return;
          }
          setSuggestion(result);
          setForm((prev) => applySuggestion(prev, result, touched.current));
        })
        .catch(() => setSuggestion(null))
        .finally(() => setDetecting(false));
    }, DETECT_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [form.name, form.websiteUrl, form.notes, form.plannedAmountEur]);

  function handleSubmit() {
    const amount = Number(form.plannedAmountEur);
    if (!form.name.trim() || !Number.isFinite(amount)) return;

    void run(
      () =>
        createDevExpenseService({
          name: form.name.trim(),
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
        onSuccess: onCreated,
      },
    );
  }

  return (
    <Card className="p-4">
      <Stack gap={3}>
        <Heading level={4}>Nouveau service</Heading>

        <Field
          label="Nom du service"
          htmlFor="exp-name"
          hint="Écris ce que tu paies, l’IA reconnaît le provider et remplit le reste."
        >
          <Input
            id="exp-name"
            value={form.name}
            onChange={(e) => patch("name", e.target.value)}
            placeholder="chatgpt plus, vercel pro, supabase…"
            autoComplete="off"
          />
        </Field>

        {detecting ? (
          <Cluster gap={2} className="text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <Text size="sm" tone="muted">
              Identification du service…
            </Text>
          </Cluster>
        ) : null}

        {suggestion && !detecting ? (
          <DetectionCard
            suggestion={suggestion}
            onDismiss={() => {
              setSuggestion(null);
              setManual(true);
            }}
          />
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Catégorie" htmlFor="exp-cat">
            <Select
              id="exp-cat"
              value={form.category}
              onChange={(e) => patch("category", e.target.value as ExpenseCategory)}
            >
              {EXPENSE_CATEGORIES.map((c) => (
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
              onChange={(e) => patch("billingCycle", e.target.value as BillingCycle)}
            >
              {Object.entries(BILLING_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
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
              onChange={(e) => patch("plannedAmountEur", e.target.value)}
              placeholder={
                suggestion?.typicalMonthlyEur != null
                  ? String(suggestion.typicalMonthlyEur)
                  : "29"
              }
            />
          </Field>
        </div>

        {manual || suggestion ? (
          <Field
            label="Identifiant provider"
            htmlFor="exp-provider"
            hint="Sert à retrouver les alternatives. Laisse tel quel si tu n’es pas sûr."
          >
            <Input
              id="exp-provider"
              value={form.providerSlug}
              onChange={(e) => patch("providerSlug", e.target.value)}
              placeholder="openai, vercel, supabase…"
              autoComplete="off"
            />
          </Field>
        ) : null}

        <Field label="URL" htmlFor="exp-url">
          <Input
            id="exp-url"
            value={form.websiteUrl}
            onChange={(e) => patch("websiteUrl", e.target.value)}
            placeholder="https://…"
          />
        </Field>

        <Field
          label="Notes"
          htmlFor="exp-notes"
          hint="Ce que tu en fais vraiment : le diagnostic s’en sert."
        >
          <Textarea
            id="exp-notes"
            rows={2}
            value={form.notes}
            onChange={(e) => patch("notes", e.target.value)}
            placeholder="Utilisé pour le scraping quotidien, ~200 appels/jour"
          />
        </Field>

        <Cluster gap={2}>
          <Button type="button" disabled={pending || !form.name.trim()} onClick={handleSubmit}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Enregistrer
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        </Cluster>
      </Stack>
    </Card>
  );
}

function applySuggestion(
  form: FormState,
  suggestion: ProviderSuggestion,
  touched: Set<keyof FormState>,
): FormState {
  const next = { ...form };

  next.providerSlug = suggestion.providerSlug;
  if (!touched.has("category")) next.category = suggestion.category;
  if (!touched.has("billingCycle")) next.billingCycle = suggestion.billingCycle;
  if (!touched.has("websiteUrl") && suggestion.websiteUrl) {
    next.websiteUrl = suggestion.websiteUrl;
  }
  if (!touched.has("plannedAmountEur") && !next.plannedAmountEur && suggestion.typicalMonthlyEur != null) {
    next.plannedAmountEur = String(suggestion.typicalMonthlyEur);
  }

  return next;
}

function DetectionCard({
  suggestion,
  onDismiss,
}: {
  suggestion: ProviderSuggestion;
  onDismiss: () => void;
}) {
  const confident = suggestion.confidence >= 0.6;

  return (
    <div className="rounded-2xl border border-[var(--dh-brand)]/30 bg-[var(--dh-brand)]/5 p-3">
      <Cluster gap={2} className="items-start justify-between">
        <Cluster gap={2} className="min-w-0 items-start">
          {confident ? (
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          ) : (
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--dh-brand)]" />
          )}
          <div className="min-w-0">
            <Text size="sm" weight="medium">
              {confident ? "Reconnu" : "Hypothèse"} : {suggestion.canonicalName}
            </Text>
            <Text size="sm" tone="muted" className="break-words">
              {suggestion.note}
            </Text>
          </div>
        </Cluster>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Ignorer la détection"
          className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </Cluster>

      <Cluster gap={1} className="mt-2 flex-wrap">
        <Badge tone="neutral">{CATEGORY_LABELS[suggestion.category]}</Badge>
        <Badge tone="neutral">{BILLING_LABELS[suggestion.billingCycle]}</Badge>
        {suggestion.typicalMonthlyEur != null ? (
          <Badge tone="info">~{suggestion.typicalMonthlyEur} €/mois</Badge>
        ) : null}
        {suggestion.source === "catalog" ? <Badge tone="neutral">Catalogue local</Badge> : null}
      </Cluster>

      {suggestion.freeTier ? (
        <Cluster gap={2} className="mt-2 items-start">
          <Gift className="mt-0.5 h-4 w-4 shrink-0 text-success" />
          <Text size="sm" tone="muted" className="break-words">
            Plan gratuit : {suggestion.freeTier}
          </Text>
        </Cluster>
      ) : null}
    </div>
  );
}
