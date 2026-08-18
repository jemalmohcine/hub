import { describe, expect, it } from "vitest";
import { buildCriticalPushPayload } from "@/modules/ai-intel/push-digest";

function alert(overrides: Partial<Parameters<typeof buildCriticalPushPayload>[0][number]> = {}) {
  return {
    dbId: "id-1",
    title: "CVE dans OpenSSL",
    summary: "Mets à jour tout de suite, le patch est sorti.",
    urgency: "urgent",
    category: "security",
    pillar: "infra",
    metadata: { hardSignal: "security", contentKind: "security" },
    ...overrides,
  };
}

describe("buildCriticalPushPayload", () => {
  it("is silent when nothing is critical", () => {
    expect(buildCriticalPushPayload([])).toBeNull();
  });

  it("keeps the item title for a single alert", () => {
    const payload = buildCriticalPushPayload([alert()]);
    expect(payload?.severity).toBe("urgent");
    expect(payload?.tag).toBe("ai:urgent");
    expect(payload?.href).toBe("/app/ai?item=id-1");
    expect(payload?.title).toContain("OpenSSL");
  });

  it("collapses two or more alerts into one phone ping", () => {
    const payload = buildCriticalPushPayload([
      alert({ dbId: "a", title: "CVE OpenSSL" }),
      alert({ dbId: "b", title: "Prix Vercel en hausse", category: "pricing" }),
      alert({ dbId: "c", title: "Panne GitHub" }),
    ]);
    expect(payload).toMatchObject({
      title: "3 alertes urgentes",
      href: "/app/ai",
      tag: "ai:urgent",
      severity: "urgent",
    });
    expect(payload?.body).toContain("OpenSSL");
  });
});
