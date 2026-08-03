import type {
  FreelanceSubtype,
  JobEmploymentCategory,
  RawJobHit,
} from "@/modules/job-board/types";

export function classifyEmployment(hit: Pick<RawJobHit, "title" | "description" | "tags">): {
  employmentCategory: JobEmploymentCategory;
  freelanceSubtype: FreelanceSubtype | null;
} {
  const blob = `${hit.title} ${hit.description} ${(hit.tags ?? []).join(" ")}`.toLowerCase();

  const isPartTime =
    /\b(part[- ]?time|temps partiel|mi[- ]?temps|partial|50\s*%|20h|24h|halftime|few hours)\b/.test(
      blob,
    );

  const isFreelance =
    /\b(freelance|freelancer|contractor|consultant|mission|interim|intérim|indépendant|independent|b2b|portage|cdd de mission)\b/.test(
      blob,
    ) ||
    (/\bcontract\b/.test(blob) && !/\b(permanent|cdi|full[- ]?time employee)\b/.test(blob));

  if (isFreelance) {
    return {
      employmentCategory: "freelance",
      freelanceSubtype: isPartTime ? "part_time" : "full_time",
    };
  }

  if (isPartTime && /\b(remote|télétravail|hybrid)\b/.test(blob)) {
    return {
      employmentCategory: "freelance",
      freelanceSubtype: "part_time",
    };
  }

  return {
    employmentCategory: "salaried",
    freelanceSubtype: null,
  };
}

export function buildCanonicalKey(hit: RawJobHit): string {
  const base = `${hit.source}:${hit.externalId || hit.url}`.toLowerCase();
  return base.replace(/\s+/g, "-").slice(0, 240);
}
