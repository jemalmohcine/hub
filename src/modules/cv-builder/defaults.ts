import type { CvDocument } from "@/modules/cv-builder/types";

export function createId(): string {
  return crypto.randomUUID();
}

export function defaultCvDocument(): CvDocument {
  return {
    title: "Mon CV développeur",
    themeId: "modern",
    profile: {
      fullName: "",
      headline: "Développeur Full-Stack",
      email: "",
      phone: "",
      location: "",
      website: "",
      github: "",
      linkedin: "",
      summary:
        "Développeur passionné par la qualité du code, les architectures scalables et l’expérience utilisateur. Expérience en TypeScript, React, Node.js et cloud.",
    },
    skillGroups: [
      {
        id: createId(),
        label: "Langages",
        skills: [
          { id: createId(), name: "TypeScript", level: "expert" },
          { id: createId(), name: "Python", level: "advanced" },
        ],
      },
      {
        id: createId(),
        label: "Frontend",
        skills: [
          { id: createId(), name: "React", level: "expert" },
          { id: createId(), name: "Next.js", level: "advanced" },
        ],
      },
      {
        id: createId(),
        label: "Backend & Cloud",
        skills: [
          { id: createId(), name: "Node.js", level: "advanced" },
          { id: createId(), name: "PostgreSQL", level: "advanced" },
          { id: createId(), name: "Docker", level: "intermediate" },
        ],
      },
    ],
    experiences: [
      {
        id: createId(),
        company: "Entreprise",
        role: "Développeur Full-Stack",
        location: "Paris",
        startDate: "2022-01",
        endDate: "",
        current: true,
        highlights: [
          "Conception et livraison de features produit en React / Next.js",
          "Mise en place de CI/CD et amélioration des performances API",
        ],
        techStack: ["TypeScript", "Next.js", "PostgreSQL", "Vercel"],
      },
    ],
    projects: [
      {
        id: createId(),
        name: "Projet personnel",
        url: "",
        description: "Application web full-stack avec authentification et API REST.",
        highlights: [
          "Architecture modulaire et tests automatisés",
          "Déploiement continu sur Vercel",
        ],
        techStack: ["Next.js", "Supabase", "Tailwind CSS"],
      },
    ],
    education: [
      {
        id: createId(),
        school: "École / Université",
        degree: "Master / Licence",
        field: "Informatique",
        startDate: "2018",
        endDate: "2021",
        highlights: ["Spécialisation développement logiciel"],
      },
    ],
    certifications: [],
    languages: [
      { id: createId(), name: "Français", level: "Natif" },
      { id: createId(), name: "Anglais", level: "Courant (C1)" },
    ],
    openSource: [],
  };
}

export function normalizeCvDocument(raw: unknown): CvDocument {
  const base = defaultCvDocument();
  if (!raw || typeof raw !== "object") return base;

  const data = raw as Partial<CvDocument>;
  return {
    title: typeof data.title === "string" ? data.title : base.title,
    themeId:
      data.themeId === "minimal" ||
      data.themeId === "modern" ||
      data.themeId === "classic" ||
      data.themeId === "tech"
        ? data.themeId
        : base.themeId,
    profile: { ...base.profile, ...(data.profile ?? {}) },
    skillGroups: Array.isArray(data.skillGroups) ? data.skillGroups : base.skillGroups,
    experiences: Array.isArray(data.experiences) ? data.experiences : base.experiences,
    projects: Array.isArray(data.projects) ? data.projects : base.projects,
    education: Array.isArray(data.education) ? data.education : base.education,
    certifications: Array.isArray(data.certifications)
      ? data.certifications
      : base.certifications,
    languages: Array.isArray(data.languages) ? data.languages : base.languages,
    openSource: Array.isArray(data.openSource) ? data.openSource : base.openSource,
    id: typeof data.id === "string" ? data.id : undefined,
  };
}
