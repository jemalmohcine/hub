import { fetchJson } from "@/modules/ai-intel/collectors/fetch";
import type { RawJobHit } from "@/modules/job-board/types";

type RemoteOkRow = {
  id?: string | number;
  company?: string;
  position?: string;
  description?: string;
  url?: string;
  location?: string;
  tags?: string[];
  date?: string;
  salary_min?: number;
  salary_max?: number;
};

export async function collectRemoteOk(): Promise<RawJobHit[]> {
  const rows = await fetchJson<RemoteOkRow[]>("https://remoteok.com/api", {
    timeoutMs: 16_000,
    headers: { Accept: "application/json" },
  });

  const hits: RawJobHit[] = [];

  for (const row of rows) {
    if (!row?.id || !row.position || !row.company) continue;

    const salary =
      row.salary_min || row.salary_max
        ? [row.salary_min, row.salary_max].filter(Boolean).join("–")
        : "";

    hits.push({
      source: "remoteok",
      externalId: String(row.id),
      company: row.company.trim(),
      title: row.position.trim(),
      description: (row.description || "").trim(),
      url: row.url?.startsWith("http")
        ? row.url
        : `https://remoteok.com/remote-jobs/${row.id}`,
      location: row.location?.trim() || "Remote",
      salaryHint: salary || undefined,
      tags: Array.isArray(row.tags) ? row.tags.map(String) : [],
      publishedAt: row.date || null,
    });
  }

  return hits.slice(0, 80);
}
