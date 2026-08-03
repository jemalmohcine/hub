import { fetchJson } from "@/modules/ai-intel/collectors/fetch";
import type { RawJobHit } from "@/modules/job-board/types";

type RemotiveJob = {
  id: number;
  title: string;
  company_name: string;
  description: string;
  url: string;
  category: string;
  job_type: string;
  candidate_required_location: string;
  salary: string;
  publication_date: string;
  tags?: string[];
};

type RemotiveResponse = {
  jobs: RemotiveJob[];
};

export async function collectRemotive(): Promise<RawJobHit[]> {
  const data = await fetchJson<RemotiveResponse>(
    "https://remotive.com/api/remote-jobs",
    { timeoutMs: 16_000 },
  );

  return (data.jobs ?? []).slice(0, 80).map((job) => ({
    source: "remotive",
    externalId: String(job.id),
    company: job.company_name.trim(),
    title: job.title.trim(),
    description: job.description.trim(),
    url: job.url,
    location: job.candidate_required_location || "Remote",
    salaryHint: job.salary || undefined,
    tags: [
      job.category,
      job.job_type,
      ...(Array.isArray(job.tags) ? job.tags : []),
    ].filter(Boolean),
    publishedAt: job.publication_date || null,
  }));
}
