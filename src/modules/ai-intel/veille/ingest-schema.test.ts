import { describe, expect, it } from "vitest";
import {
  parseVeilleIngestBody,
  veilleIngestRow,
} from "@/modules/ai-intel/veille/ingest-schema";

describe("veille ingest schema", () => {
  it("accepts a single item", () => {
    const rows = parseVeilleIngestBody({
      date: "2026-10-31",
      category: "securite",
      provider: "laravel-php",
      severity: "critique",
      title: "Test",
      summary: "Résumé court.",
      link: "https://example.com/advisory",
    });
    expect(rows).toHaveLength(1);
    expect(veilleIngestRow(rows[0]!).feed_date).toBe("2026-10-31");
  });

  it("accepts an array and maps fields", () => {
    const rows = parseVeilleIngestBody([
      {
        date: "2026-10-31",
        category: "repos-github",
        provider: "github",
        severity: "info",
        title: "Repo",
        summary: "Momentum.",
        link: "https://github.com/org/repo",
        stars_week: 120,
        tags: ["agent-ingest"],
      },
    ]);
    const row = veilleIngestRow(rows[0]!);
    expect(row.stars_week).toBe(120);
    expect(row.tags).toEqual(["agent-ingest"]);
  });
});
