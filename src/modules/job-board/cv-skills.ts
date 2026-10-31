import type { CvDocument, CvExperience } from "@/modules/cv-builder/types";
import { daysBetween, toDate } from "@/lib/dates";
import { foldCase } from "@/lib/text";
import { prefsHintFromCv } from "@/modules/job-board/prefs-from-cv";

export type CvJobProfile = {
  id: string;
  title: string;
  skills: string[];
  years: number;
  roles: string[];
  locations: string[];
};

function parseCvDate(raw: string | undefined): Date | null {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return null;
  return toDate(trimmed) ?? toDate(`${trimmed}-01`) ?? toDate(`${trimmed}-01-01`);
}

/** Overlapping jobs still count once per calendar span — good enough for seniority. */
export function yearsFromExperiences(
  experiences: CvExperience[] | undefined,
  now: Date = new Date(),
): number {
  let days = 0;
  for (const exp of experiences ?? []) {
    const start = parseCvDate(exp.startDate);
    if (!start) continue;
    const end = exp.current ? now : parseCvDate(exp.endDate) ?? now;
    const span = daysBetween(start, end);
    if (span > 0) days += span;
  }
  if (days <= 0) return 0;
  return Math.round((days / 365.25) * 10) / 10;
}

/** Distinctive skills from a CV, used to rank offers the user can actually land. */
export function skillsFromCv(doc: CvDocument | null | undefined): string[] {
  if (!doc?.id) return [];
  const names = doc.skillGroups.flatMap((group) =>
    group.skills.map((skill) => skill.name.trim()),
  );
  const stack = [
    ...(doc.experiences ?? []).flatMap((exp) => exp.techStack ?? []),
    ...(doc.projects ?? []).flatMap((project) => project.techStack ?? []),
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [...names, ...stack]) {
    const value = raw.trim();
    const key = foldCase(value);
    if (key.length < 2 || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= 32) break;
  }
  return out;
}

export function profileFromCv(doc: CvDocument | null | undefined): CvJobProfile | null {
  if (!doc?.id) return null;
  const hint = prefsHintFromCv(doc);
  return {
    id: doc.id,
    title: doc.title,
    skills: skillsFromCv(doc),
    years: yearsFromExperiences(doc.experiences),
    roles: hint.roles,
    locations: hint.locations,
  };
}
