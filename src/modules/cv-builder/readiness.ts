import type { CvDocument } from "@/modules/cv-builder/types";

export type CvReadySection = "profile" | "skills" | "experience" | "projects" | "extra";

export type CvReadyHint = {
  id: string;
  section: CvReadySection;
  label: string;
};

export type CvReadiness = {
  score: number;
  ready: boolean;
  hints: CvReadyHint[];
  summary: string;
};

function skillCount(doc: CvDocument): number {
  return doc.skillGroups.reduce((sum, group) => sum + group.skills.filter((s) => s.name.trim()).length, 0);
}

function realExperiences(doc: CvDocument) {
  return doc.experiences.filter((exp) => exp.role.trim() && exp.company.trim());
}

/** What is still missing before this CV can filter Offres well. */
export function cvReadiness(doc: CvDocument): CvReadiness {
  const hints: CvReadyHint[] = [];
  let score = 0;

  if (doc.profile.fullName.trim().length >= 3) score += 12;
  else hints.push({ id: "name", section: "profile", label: "Ajoute ton nom" });

  if (doc.profile.email.includes("@")) score += 8;
  else hints.push({ id: "email", section: "profile", label: "Ajoute un email" });

  const role =
    doc.targetJobTitle?.trim() ||
    doc.profile.headline.trim() ||
    doc.experiences.find((exp) => exp.current)?.role.trim() ||
    "";
  if (role.length >= 3) score += 15;
  else hints.push({ id: "role", section: "profile", label: "Indique le poste visé" });

  if (doc.profile.location.trim().length >= 2) score += 8;
  else hints.push({ id: "city", section: "profile", label: "Ajoute ta ville" });

  if (doc.profile.summary.trim().length >= 40) score += 10;
  else hints.push({ id: "summary", section: "profile", label: "Écris un résumé de 2–3 phrases" });

  const experiences = realExperiences(doc);
  if (experiences.length > 0) score += 18;
  else hints.push({ id: "exp", section: "experience", label: "Ajoute au moins un poste" });

  if (experiences.some((exp) => exp.highlights.some((h) => h.trim().length >= 12))) score += 10;
  else if (experiences.length > 0) {
    hints.push({ id: "impact", section: "experience", label: "Décris un impact concret sur un poste" });
  }

  const skills = skillCount(doc);
  if (skills >= 3) score += 12;
  else hints.push({ id: "skills", section: "skills", label: "Liste au moins 3 compétences" });

  const projects = doc.projects.filter((p) => p.name.trim()).length;
  if (projects > 0 || experiences.length >= 2) score += 7;
  else hints.push({ id: "proof", section: "projects", label: "Ajoute un projet ou un second poste" });

  const named = doc.profile.fullName.trim().length >= 3;
  const emailed = doc.profile.email.includes("@");
  const ready =
    score >= 70 && named && emailed && Boolean(role) && skills >= 2 && experiences.length > 0;
  const summary = ready
    ? "CV assez complet pour filtrer les offres."
    : `Encore ${Math.max(hints.length, 1)} étape${hints.length > 1 ? "s" : ""} pour matcher les offres.`;

  return { score: Math.min(100, score), ready, hints: hints.slice(0, 4), summary };
}
