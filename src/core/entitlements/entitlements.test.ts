import { describe, expect, it } from "vitest";
import {
  ALL_ENTITLEMENTS,
  ENTITLEMENTS,
  entitlementsForPlan,
  hasEntitlement,
  PLAN_ENTITLEMENTS,
} from "@/core/entitlements";
import { MODULE_REGISTRY } from "@/core/module-registry";

describe("entitlementsForPlan", () => {
  it("gives free users nothing", () => {
    expect(entitlementsForPlan("free")).toEqual([]);
  });

  it("gives pro users every module", () => {
    expect(entitlementsForPlan("pro")).toEqual([...ALL_ENTITLEMENTS]);
  });

  it("defaults to free for missing or unknown plans", () => {
    expect(entitlementsForPlan(null)).toEqual([]);
    expect(entitlementsForPlan(undefined)).toEqual([]);
  });
});

describe("hasEntitlement", () => {
  it("treats a null requirement as public", () => {
    expect(hasEntitlement([], null)).toBe(true);
  });

  it("checks membership", () => {
    expect(hasEntitlement([ENTITLEMENTS.ai], ENTITLEMENTS.ai)).toBe(true);
    expect(hasEntitlement([ENTITLEMENTS.ai], ENTITLEMENTS.cv)).toBe(false);
  });
});

describe("module registry", () => {
  it("only references known entitlement keys", () => {
    for (const mod of MODULE_REGISTRY) {
      if (mod.requiredEntitlement === null) continue;
      expect(ALL_ENTITLEMENTS).toContain(mod.requiredEntitlement);
    }
  });

  it("unlocks every gated module on the pro plan", () => {
    const gated = MODULE_REGISTRY.map((mod) => mod.requiredEntitlement).filter(
      (key) => key !== null,
    );
    for (const key of gated) {
      expect(PLAN_ENTITLEMENTS.pro).toContain(key);
    }
  });

  it("gives every module the copy the page shell needs", () => {
    for (const mod of MODULE_REGISTRY) {
      expect(mod.label.length).toBeGreaterThan(0);
      expect(mod.description.length).toBeGreaterThan(0);
      expect(mod.pageDescription.length).toBeGreaterThan(0);
      if (mod.requiredEntitlement) {
        expect(mod.upsell.length).toBeGreaterThan(0);
      }
    }
  });

  it("has unique ids and orders", () => {
    const ids = MODULE_REGISTRY.map((mod) => mod.id);
    const orders = MODULE_REGISTRY.map((mod) => mod.order);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(orders).size).toBe(orders.length);
  });
});
