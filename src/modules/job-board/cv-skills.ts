import type { CvDocument } from "@/modules/cv-builder/types";
import { foldCase } from "@/lib/text";

/** Distinctive skills from a CV, used to rank offers the user can actually land. */
export function skillsFromCv(doc: CvDocument | null | undefined): string[] {
  if (!doc?.id) return [];
  const names = doc.skillGroups.flatMap((group) =>
    group.skills.map((skill) => skill.name.trim()),
  );
  const stack = doc.experiences.flatMap((exp) => exp.techStack);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of [...names, ...stack]) {
    const value = raw.trim();
    const key = foldCase(value);
    if (key.length < 2 || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= 16) break;
  }
  return out;
}
