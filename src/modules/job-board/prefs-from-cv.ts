import type { CvDocument } from "@/modules/cv-builder/types";
import { resolveLocation } from "@/modules/job-board/locations";
import { resolveRole } from "@/modules/job-board/roles";

function splitLocationBlob(raw: string): string[] {
  return raw
    .split(/[,/|–—-]/g)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);
}

function roleFromTitle(title: string): string | null {
  const trimmed = title.replace(/^CV\s*[·•\-]\s*/i, "").trim();
  const cut = trimmed.split(/\s+en\s+(CDI|CDD|freelance|stage|alternance)/i)[0]?.trim() ?? trimmed;
  if (cut.length < 3) return null;
  return cut.slice(0, 80);
}

/** Prefill search chips from a saved CV (headline, target job, city). */
export function prefsHintFromCv(doc: CvDocument | null | undefined): {
  roles: string[];
  locations: string[];
} {
  if (!doc?.id) return { roles: [], locations: [] };

  const roleBits = [
    doc.targetJobTitle,
    roleFromTitle(doc.title),
    doc.profile.headline,
    doc.experiences.find((exp) => exp.current)?.role,
    doc.experiences[0]?.role,
  ].filter((value): value is string => Boolean(value?.trim()));

  const locationBits = [
    ...splitLocationBlob(doc.profile.location ?? ""),
    ...splitLocationBlob(doc.experiences.find((exp) => exp.current)?.location ?? ""),
    ...splitLocationBlob(doc.experiences[0]?.location ?? ""),
  ];

  const roles = roleBits
    .map((bit) => resolveRole(bit).id)
    .filter((id, index, all) => all.indexOf(id) === index)
    .slice(0, 3);

  const locations = locationBits
    .map((bit) => resolveLocation(bit).id)
    .filter((id, index, all) => all.indexOf(id) === index)
    .slice(0, 4);

  return { roles, locations };
}
