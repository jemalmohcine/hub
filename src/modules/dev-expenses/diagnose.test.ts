import { describe, expect, it } from "vitest";
import {
  effectiveMonthlyCents,
  monthlyEquivalentCents,
} from "@/modules/dev-expenses/amounts";
import {
  alternativesFor,
  matchProviderFromText,
  suggestProviderFromCatalog,
} from "@/modules/dev-expenses/catalog";
import {
  diagnoseBudgetLocally,
  diagnoseServiceLocally,
} from "@/modules/dev-expenses/diagnose";
import type { ServiceWithStats } from "@/modules/dev-expenses/types";

function service(patch: Partial<ServiceWithStats> = {}): ServiceWithStats {
  return {
    id: patch.name ?? "id",
    name: "Vercel",
    providerSlug: "vercel",
    category: "hosting",
    billingCycle: "monthly",
    plannedAmountCents: 2000,
    currency: "EUR",
    websiteUrl: null,
    notes: null,
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    monthAmountCents: null,
    ytdTotalCents: 0,
    entryCount: 0,
    ...patch,
  };
}

describe("monthlyEquivalentCents", () => {
  it("spreads a yearly plan over twelve months", () => {
    expect(monthlyEquivalentCents(service({ billingCycle: "yearly", plannedAmountCents: 12_000 })))
      .toBe(1_000);
  });

  it("leaves monthly plans untouched", () => {
    expect(monthlyEquivalentCents(service({ plannedAmountCents: 2_500 }))).toBe(2_500);
  });
});

describe("effectiveMonthlyCents", () => {
  it("prefers the logged amount over the planned one", () => {
    expect(effectiveMonthlyCents(service({ plannedAmountCents: 2_000, monthAmountCents: 3_450 })))
      .toBe(3_450);
  });

  it("falls back to the plan when nothing was logged", () => {
    expect(effectiveMonthlyCents(service({ plannedAmountCents: 2_000 }))).toBe(2_000);
  });
});

describe("matchProviderFromText", () => {
  it("recognises a provider from a colloquial name", () => {
    expect(matchProviderFromText("chatgpt plus")?.slug).toBe("openai");
    expect(matchProviderFromText("cloud flare workers")?.slug).toBe("cloudflare");
  });

  it("prefers the longest matching alias", () => {
    expect(matchProviderFromText("github copilot")?.slug).toBe("github");
  });

  it("reads the URL when the name says nothing", () => {
    expect(matchProviderFromText("abonnement mensuel", "https://supabase.com/dashboard")?.slug)
      .toBe("supabase");
  });

  it("returns null for an unknown service", () => {
    expect(matchProviderFromText("outil interne de l'agence")).toBeNull();
  });

  it("does not match an alias buried inside another word", () => {
    expect(matchProviderFromText("figmatique")).toBeNull();
  });
});

describe("suggestProviderFromCatalog", () => {
  it("returns a low-confidence suggestion flagged as catalog", () => {
    const suggestion = suggestProviderFromCatalog("vercel pro");
    expect(suggestion?.providerSlug).toBe("vercel");
    expect(suggestion?.category).toBe("hosting");
    expect(suggestion?.source).toBe("catalog");
    expect(suggestion?.confidence).toBeLessThan(1);
  });
});

describe("alternativesFor", () => {
  it("uses the provider's own list when it has one", () => {
    const slugs = alternativesFor("openai", "ai_api").map((a) => a.slug);
    expect(slugs).toContain("google_gemini");
  });

  it("falls back to the category when the provider is unknown", () => {
    const slugs = alternativesFor("some-indie-tool", "email").map((a) => a.slug);
    expect(slugs).toContain("resend");
  });

  it("returns nothing for categories with no catalogued option", () => {
    expect(alternativesFor(null, "other")).toEqual([]);
  });
});

describe("diagnoseServiceLocally", () => {
  it("flags a switch when a much cheaper option exists", () => {
    const datadog = service({
      name: "Datadog",
      providerSlug: "datadog",
      category: "monitoring",
      plannedAmountCents: 12_000,
    });

    const result = diagnoseServiceLocally(datadog, 12_000, 20_000);
    expect(result.verdict).toBe("consider_switch");
    expect(result.potentialSavingsEur).toBeGreaterThan(0);
    expect(result.source).toBe("catalog");
  });

  it("keeps a cheap service and still reports its share of the budget", () => {
    const result = diagnoseServiceLocally(service({ plannedAmountCents: 500 }), 500, 10_000);
    expect(result.verdict).toBe("keep");
    expect(result.shareOfBudgetPct).toBe(5);
  });

  it("warns about usage billing", () => {
    const result = diagnoseServiceLocally(
      service({ billingCycle: "usage", plannedAmountCents: 300 }),
      300,
      10_000,
    );
    expect(result.actions.join(" ")).toContain("alerte de budget");
  });
});

describe("diagnoseBudgetLocally", () => {
  it("reports a duplicate when two paid services share a category", () => {
    const report = diagnoseBudgetLocally([
      service({ id: "a", name: "Vercel", plannedAmountCents: 2_000 }),
      service({ id: "b", name: "Netlify", providerSlug: "netlify", plannedAmountCents: 1_900 }),
    ]);

    const duplicate = report.findings.find((f) => f.kind === "duplicate");
    expect(duplicate?.services).toEqual(["Vercel", "Netlify"]);
    expect(duplicate?.monthlySavingsEur).toBe(19);
  });

  it("points out a paid service whose free plan would do", () => {
    const report = diagnoseBudgetLocally([
      service({ id: "a", name: "Vercel", plannedAmountCents: 2_000 }),
    ]);

    expect(report.findings.some((f) => f.kind === "free_alternative")).toBe(true);
    expect(report.monthlySavingsEur).toBe(20);
  });

  it("asks for a real amount when a service was never logged", () => {
    const report = diagnoseBudgetLocally([
      service({
        id: "a",
        name: "Datadog",
        providerSlug: "datadog",
        category: "monitoring",
        plannedAmountCents: 12_000,
      }),
    ]);

    expect(report.findings.some((f) => f.kind === "underused")).toBe(true);
  });

  it("says so when there is nothing to cut", () => {
    const report = diagnoseBudgetLocally([
      service({
        id: "a",
        name: "Outil maison",
        providerSlug: null,
        category: "other",
        plannedAmountCents: 200,
        monthAmountCents: 200,
        entryCount: 1,
      }),
    ]);

    expect(report.findings).toHaveLength(1);
    expect(report.findings[0].kind).toBe("healthy");
    expect(report.monthlySavingsEur).toBe(0);
    expect(report.healthScore).toBe(100);
  });

  it("ignores inactive services", () => {
    const report = diagnoseBudgetLocally([
      service({ id: "a", name: "Vercel", plannedAmountCents: 2_000, isActive: false }),
    ]);

    expect(report.findings[0].kind).toBe("healthy");
  });
});
