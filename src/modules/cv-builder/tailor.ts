import { createId } from "@/modules/cv-builder/defaults";
import type {
  CvDocument,
  CvSkillGroup,
} from "@/modules/cv-builder/types";

const TECH_VOCAB = [
  "typescript",
  "javascript",
  "python",
  "java",
  "go",
  "golang",
  "rust",
  "c#",
  "c++",
  "php",
  "ruby",
  "swift",
  "kotlin",
  "react",
  "next.js",
  "nextjs",
  "vue",
  "angular",
  "svelte",
  "node",
  "node.js",
  "express",
  "nestjs",
  "django",
  "flask",
  "fastapi",
  "spring",
  "graphql",
  "rest",
  "api",
  "postgresql",
  "postgres",
  "mysql",
  "mongodb",
  "redis",
  "supabase",
  "firebase",
  "aws",
  "gcp",
  "azure",
  "docker",
  "kubernetes",
  "k8s",
  "terraform",
  "ci/cd",
  "git",
  "linux",
  "tailwind",
  "css",
  "html",
  "figma",
  "agile",
  "scrum",
  "microservices",
  "serverless",
  "vercel",
  "prisma",
  "tailwind css",
  "machine learning",
  "ml",
  "ai",
  "llm",
  "openai",
  "langchain",
  "devops",
  "full stack",
  "fullstack",
  "frontend",
  "backend",
  "mobile",
  "react native",
  "flutter",
  "ios",
  "android",
  "sql",
  "nosql",
  "elasticsearch",
  "kafka",
  "rabbitmq",
  "jest",
  "cypress",
  "playwright",
  "testing",
  "tdd",
];

const ROLE_PATTERNS = [
  /(?:nous recherchons|recherche|poste de|offre)\s*[:\-]?\s*(.{5,80})/i,
  /(?:développeur|developer|engineer|ingénieur|architecte|lead|senior|junior)\s+[^.\n]{3,60}/i,
  /^(.{5,80})$/m,
];

function normalizeToken(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function extractKeywords(jobDescription: string): string[] {
  const lower = jobDescription.toLowerCase();
  const found = new Set<string>();

  for (const term of TECH_VOCAB) {
    if (lower.includes(term)) found.add(term);
  }

  const tokens = lower.match(/[a-z+#/]{2,}(?:\.[a-z]+)?/g) ?? [];
  for (const token of tokens) {
    if (token.length >= 3 && !["the", "and", "des", "les", "une", "pour"].includes(token)) {
      found.add(token);
    }
  }

  return [...found].slice(0, 24);
}

function detectRole(jobDescription: string): string | null {
  const trimmed = jobDescription.trim();
  if (!trimmed) return null;

  for (const pattern of ROLE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      const role = match[1].replace(/\s+/g, " ").trim();
      if (role.length >= 5 && role.length <= 80) return role;
    }
    if (match?.[0] && !match[1]) {
      const role = match[0].replace(/\s+/g, " ").trim();
      if (role.length >= 5 && role.length <= 80) return role;
    }
  }

  const firstLine = trimmed.split("\n").find((line) => line.trim().length > 4);
  return firstLine?.trim().slice(0, 80) ?? null;
}

function keywordScore(text: string, keywords: string[]): number {
  const lower = normalizeToken(text);
  let score = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) score += kw.length > 5 ? 3 : 2;
  }
  return score;
}

function sortByRelevance<T>(items: T[], keywords: string[], toText: (item: T) => string): T[] {
  return [...items].sort(
    (a, b) => keywordScore(toText(b), keywords) - keywordScore(toText(a), keywords),
  );
}

function tuneHighlights(highlights: string[], keywords: string[]): string[] {
  const sorted = sortByRelevance(highlights, keywords, (h) => h);
  return sorted.map((line) => {
    const lower = line.toLowerCase();
    const missing = keywords.filter((kw) => !lower.includes(kw)).slice(0, 2);
    if (missing.length === 0 || line.length > 140) return line;
    const extra = missing
      .map((kw) => kw.charAt(0).toUpperCase() + kw.slice(1))
      .join(", ");
    return `${line} (aligné ${extra})`;
  });
}

function reorderSkillGroups(groups: CvSkillGroup[], keywords: string[]): CvSkillGroup[] {
  return groups.map((group) => ({
    ...group,
    skills: sortByRelevance(
      group.skills,
      keywords,
      (s) => `${s.name} ${s.level ?? ""}`,
    ),
  }));
}

function buildTailoredSummary(
  baseSummary: string,
  role: string,
  matchedSkills: string[],
  keywords: string[],
): string {
  const skillsPhrase =
    matchedSkills.length > 0
      ? matchedSkills.slice(0, 6).join(", ")
      : keywords.slice(0, 5).join(", ");

  const intro = `${role}. Profil orienté vers ce poste avec expertise sur ${skillsPhrase}.`;
  const trimmedBase = baseSummary.trim();
  if (!trimmedBase) return intro;
  if (trimmedBase.length < 120) return `${intro} ${trimmedBase}`;
  return `${intro} ${trimmedBase.slice(0, 220).trim()}…`;
}

function collectMatchingSkills(doc: CvDocument, keywords: string[]): string[] {
  const names: string[] = [];
  for (const group of doc.skillGroups) {
    for (const skill of group.skills) {
      const lower = skill.name.toLowerCase();
      if (keywords.some((kw) => lower.includes(kw) || kw.includes(lower))) {
        names.push(skill.name);
      }
    }
  }
  return [...new Set(names)];
}

export function tailorCvForJob(doc: CvDocument, jobDescription: string): CvDocument {
  const trimmed = jobDescription.trim();
  if (!trimmed) {
    throw new Error("Collez la description du poste pour adapter le CV");
  }

  const keywords = extractKeywords(trimmed);
  const role = detectRole(trimmed) ?? doc.profile.headline;
  const matchedSkills = collectMatchingSkills(doc, keywords);

  const experiences = sortByRelevance(doc.experiences, keywords, (exp) =>
    [exp.role, exp.company, ...exp.highlights, ...exp.techStack].join(" "),
  ).map((exp) => ({
    ...exp,
    id: createId(),
    highlights: tuneHighlights(exp.highlights, keywords),
    techStack: sortByRelevance(exp.techStack, keywords, (t) => t),
  }));

  const projects = sortByRelevance(doc.projects, keywords, (proj) =>
    [proj.name, proj.description, ...proj.highlights, ...proj.techStack].join(" "),
  ).map((proj) => ({
    ...proj,
    id: createId(),
    highlights: tuneHighlights(proj.highlights, keywords),
    techStack: sortByRelevance(proj.techStack, keywords, (t) => t),
  }));

  const skillGroups = reorderSkillGroups(doc.skillGroups, keywords);

  const snippet = trimmed.slice(0, 500);

  return {
    ...doc,
    id: undefined,
    title: `CV · ${role.slice(0, 60)}`,
    isTailored: true,
    targetJobTitle: role,
    jobDescriptionSnippet: snippet,
    profile: {
      ...doc.profile,
      headline: role,
      summary: buildTailoredSummary(doc.profile.summary, role, matchedSkills, keywords),
    },
    skillGroups: skillGroups.map((g) => ({ ...g, id: createId() })),
    experiences,
    projects,
    education: doc.education.map((e) => ({ ...e, id: createId() })),
    certifications: doc.certifications.map((c) => ({ ...c, id: createId() })),
    languages: doc.languages.map((l) => ({ ...l, id: createId() })),
    openSource: doc.openSource.map((o) => ({ ...o, id: createId() })),
  };
}

export function tailorPreviewHints(jobDescription: string): {
  role: string | null;
  keywords: string[];
} {
  return {
    role: detectRole(jobDescription),
    keywords: extractKeywords(jobDescription),
  };
}
