import {
  effectiveMonthlyCents,
  monthlyEquivalentCents,
} from "@/modules/dev-expenses/amounts";
import { alternativesFor, findProvider } from "@/modules/dev-expenses/catalog";
import type {
  AlternativeOption,
  BudgetDiagnostic,
  BudgetFinding,
  DevExpenseService,
  ExpenseDiagnostic,
  ServiceWithStats,
} from "@/modules/dev-expenses/types";
import { CATEGORY_LABELS } from "@/modules/dev-expenses/types";

/**
 * Deterministic diagnostics. They run instantly, they never cost anything, and
 * they are what the UI shows when no LLM is configured or the call fails.
 */

function eur(cents: number): number {
  return Math.round(cents) / 100;
}

function cheapestPrice(alternatives: AlternativeOption[]): number | null {
  let cheapest: number | null = null;
  for (const alt of alternatives) {
    if (alt.typicalMonthlyEur == null) continue;
    cheapest = cheapest == null ? alt.typicalMonthlyEur : Math.min(cheapest, alt.typicalMonthlyEur);
  }
  return cheapest;
}

export function diagnoseServiceLocally(
  service: DevExpenseService,
  actualMonthlyCents: number,
  totalMonthlyCents: number,
): ExpenseDiagnostic {
  const spendCents = actualMonthlyCents || monthlyEquivalentCents(service);
  const monthlySpendEur = eur(spendCents);
  const shareOfBudgetPct =
    totalMonthlyCents > 0 ? Math.round((spendCents / totalMonthlyCents) * 100) : 0;

  const alternatives = alternativesFor(service.providerSlug, service.category);
  const cheapest = cheapestPrice(alternatives);
  const potentialSavingsEur =
    cheapest != null && monthlySpendEur > cheapest
      ? Math.round(monthlySpendEur - cheapest)
      : null;

  const provider = findProvider(service.providerSlug);
  const freeOption = alternatives.find((alt) => alt.typicalMonthlyEur === 0);

  const actions: string[] = [];
  const risks: string[] = [];

  if (provider?.freeTier && monthlySpendEur > 0) {
    actions.push(`Vérifie si le plan gratuit suffit : ${provider.freeTier}.`);
  }
  if (freeOption) {
    actions.push(
      `Teste ${freeOption.name} sur un projet secondaire avant de migrer${
        freeOption.freeTier ? ` (${freeOption.freeTier})` : ""
      }.`,
    );
    if (freeOption.cons[0]) risks.push(freeOption.cons[0]);
  }
  if (service.billingCycle === "yearly") {
    actions.push("Note la date de renouvellement pour décider avant le prélèvement annuel.");
  }
  if (service.billingCycle === "usage") {
    actions.push("Pose une alerte de budget côté provider : la facture d'usage dérive vite.");
  }

  let verdict: ExpenseDiagnostic["verdict"] = "keep";
  let verdictLabel = "OK pour ton usage";
  let summary = "Coût raisonnable pour cette catégorie. Rien à changer dans l'immédiat.";

  if (monthlySpendEur >= 80 && potentialSavingsEur != null && potentialSavingsEur >= 30) {
    verdict = "consider_switch";
    verdictLabel = "Alternative moins chère crédible";
    summary = `Environ ${potentialSavingsEur} €/mois récupérables en changeant d'option. Compare les usages réels avant de migrer.`;
  } else if (monthlySpendEur >= 40 || shareOfBudgetPct >= 35) {
    verdict = "review";
    verdictLabel = "À revoir";
    summary = `Ce poste pèse ${shareOfBudgetPct}% de ton budget dev. Compare les alternatives avant le prochain renouvellement.`;
  } else if (potentialSavingsEur != null && potentialSavingsEur >= 15) {
    verdict = "review";
    verdictLabel = "Optimisation possible";
    summary = `Des options moins chères existent (estimation −${potentialSavingsEur} €/mois). Vérifie qu'elles couvrent tes besoins.`;
  }

  return {
    verdict,
    verdictLabel,
    summary,
    monthlySpendEur,
    shareOfBudgetPct,
    alternatives: alternatives.slice(0, 3),
    potentialSavingsEur,
    actions: actions.slice(0, 3),
    risks: risks.slice(0, 2),
    source: "catalog",
  };
}

const EFFORT_PENALTY = { low: 6, medium: 10, high: 14 } as const;

/**
 * Whole-budget review: overlapping tools, paid services with a usable free
 * plan, one line item eating the budget, and services never actually logged.
 */
export function diagnoseBudgetLocally(services: ServiceWithStats[]): BudgetDiagnostic {
  const active = services.filter((s) => s.isActive);
  const totalCents = active.reduce((sum, s) => sum + effectiveMonthlyCents(s), 0);
  const findings: BudgetFinding[] = [];

  const byCategory = new Map<string, ServiceWithStats[]>();
  for (const service of active) {
    const bucket = byCategory.get(service.category) ?? [];
    bucket.push(service);
    byCategory.set(service.category, bucket);
  }

  for (const [category, bucket] of byCategory) {
    const paid = bucket.filter((s) => effectiveMonthlyCents(s) > 0);
    if (paid.length < 2) continue;

    const sorted = [...paid].sort((a, b) => effectiveMonthlyCents(b) - effectiveMonthlyCents(a));
    const droppable = sorted.slice(1).reduce((sum, s) => sum + effectiveMonthlyCents(s), 0);

    findings.push({
      kind: "duplicate",
      title: `${paid.length} services payants en ${CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}`,
      detail: `${paid.map((s) => s.name).join(", ")} couvrent le même besoin. Un seul suffit dans la plupart des cas.`,
      services: paid.map((s) => s.name),
      monthlySavingsEur: droppable > 0 ? eur(droppable) : null,
      effort: "medium",
      recommendation: `Garde ${sorted[0].name} et migre le reste, ou inverse si le moins cher couvre ton usage.`,
    });
  }

  for (const service of active) {
    const spendCents = effectiveMonthlyCents(service);
    if (spendCents <= 0) continue;

    const spendEur = eur(spendCents);
    const provider = findProvider(service.providerSlug);
    const alternatives = alternativesFor(service.providerSlug, service.category);
    const freeOption = alternatives.find((alt) => alt.typicalMonthlyEur === 0);

    if (provider?.freeTier && spendEur <= 30) {
      findings.push({
        kind: "free_alternative",
        title: `${service.name} a un plan gratuit`,
        detail: `${provider.freeTier}. À ce niveau de dépense, le plan payant ne se justifie que si tu dépasses ces quotas.`,
        services: [service.name],
        monthlySavingsEur: spendEur,
        effort: "low",
        recommendation: "Compare ta consommation réelle aux quotas gratuits avant le prochain renouvellement.",
      });
      continue;
    }

    if (freeOption && spendEur >= 15) {
      findings.push({
        kind: "free_alternative",
        title: `${freeOption.name} peut remplacer ${service.name}`,
        detail: `${freeOption.freeTier ?? "Option gratuite ou quasi gratuite"}. ${freeOption.bestFor}.`,
        services: [service.name],
        monthlySavingsEur: spendEur,
        effort: freeOption.migrationEffort,
        recommendation: `Teste ${freeOption.name} sur un projet secondaire avant de basculer.`,
      });
      continue;
    }

    const sharePct = totalCents > 0 ? Math.round((spendCents / totalCents) * 100) : 0;
    if (sharePct >= 40 && spendEur >= 25) {
      findings.push({
        kind: "overpriced",
        title: `${service.name} pèse ${sharePct}% du budget`,
        detail: `${spendEur} €/mois sur un total de ${eur(totalCents)} €. Un seul poste concentre ta dépense.`,
        services: [service.name],
        monthlySavingsEur: null,
        effort: "medium",
        recommendation: "Vérifie le palier de plan que tu utilises vraiment et descends d'un cran si possible.",
      });
    }
  }

  for (const service of active) {
    if (service.entryCount > 0 || service.monthAmountCents != null) continue;
    if (monthlyEquivalentCents(service) <= 0) continue;

    findings.push({
      kind: "underused",
      title: `${service.name} n'a jamais été relevé`,
      detail: "Aucun montant réel enregistré : impossible de savoir si le budget prévu correspond à la facture.",
      services: [service.name],
      monthlySavingsEur: null,
      effort: "low",
      recommendation: "Saisis le montant réel du mois pour que le diagnostic porte sur des chiffres, pas des estimations.",
    });
  }

  const monthlySavingsEur = findings.reduce((sum, f) => sum + (f.monthlySavingsEur ?? 0), 0);
  const healthScore = Math.max(
    0,
    Math.min(100, 100 - findings.reduce((sum, f) => sum + EFFORT_PENALTY[f.effort], 0)),
  );

  if (findings.length === 0) {
    findings.push({
      kind: "healthy",
      title: "Budget cohérent",
      detail: `${active.length} service${active.length > 1 ? "s" : ""} actif${active.length > 1 ? "s" : ""} pour ${eur(totalCents)} €/mois, sans doublon ni poste disproportionné.`,
      services: [],
      monthlySavingsEur: null,
      effort: "low",
      recommendation: "Relève les montants réels chaque mois pour détecter une dérive tôt.",
    });
  }

  const quickWins = findings
    .filter((f) => f.effort === "low" && f.kind !== "healthy")
    .map((f) => f.recommendation)
    .slice(0, 3);

  return {
    headline:
      monthlySavingsEur > 0
        ? `Environ ${Math.round(monthlySavingsEur)} €/mois récupérables`
        : "Rien d'évident à couper",
    summary:
      monthlySavingsEur > 0
        ? `Sur ${eur(totalCents)} €/mois, ${findings.length} point${findings.length > 1 ? "s" : ""} méritent une décision. Commence par les gains sans migration.`
        : `Ton budget de ${eur(totalCents)} €/mois tient la route. Surveille les postes en facturation à l'usage.`,
    healthScore,
    monthlySavingsEur: Math.round(monthlySavingsEur),
    findings,
    quickWins,
    source: "catalog",
    generatedAt: new Date().toISOString(),
  };
}
