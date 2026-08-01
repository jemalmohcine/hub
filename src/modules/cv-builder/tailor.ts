import { createId } from "@/modules/cv-builder/defaults";
import type {
  CvDocument,
  CvSkillGroup,
  CvTailorRecommendation,
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
  "back-end",
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

const SOFT_VOCAB = [
  "leadership",
  "mentor",
  "mentorat",
  "communication",
  "autonomie",
  "rigoureux",
  "équipe",
  "team",
  "collaboration",
  "anglais",
  "english",
  "remote",
  "télétravail",
];

const JOB_KEYWORD_REGEX =
  /développeur|developer|engineer|ingénieur|architecte|devops|full[\s-]?stack|front[\s-]?end|back[\s-]?end|data|mobile|lead|senior|junior/i;

const ROLE_TITLE_PATTERNS = [
  /(?:intitulé|titre)\s*(?:du poste)?\s*[:\-]\s*(.{4,70})/i,
  /(?:poste|mission|fonction|role|rôle)\s*[:\-]\s*(.{4,70})/i,
  /((?:senior|junior|lead|principal|staff|confirmé[e]?)\s+(?:développeur|developer|ingénieur|engineer|devops|architecte)[^.\n]{0,45})/i,
  /((?:développeur|developer|ingénieur|engineer|devops|architecte)\s+(?:full[\s-]?stack|front[\s-]?end|back[\s-]?end|mobile|web|logiciel)[^.\n]{0,35})/i,
  /((?:full[\s-]?stack|front[\s-]?end|back[\s-]?end|mobile)\s*(?:developer|développeur|engineer|ingénieur)?)/i,
];

const STOPWORDS = new Set([
  "the",
  "and",
  "des",
  "les",
  "une",
  "pour",
  "avec",
  "dans",
  "sur",
  "par",
  "est",
  "nous",
  "vous",
  "your",
  "our",
  "job",
  "poste",
  "offre",
  "emploi",
  "hiring",
  "recrute",
]);

export type TailorCvResult = {
  document: CvDocument;
  recommendations: CvTailorRecommendation[];
};

function normalizeToken(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatKeyword(keyword: string): string {
  if (keyword.length <= 3) return keyword.toUpperCase();
  return keyword
    .split(/[\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(keyword.includes(".") ? "." : " ");
}

function extractKeywords(jobDescription: string): string[] {
  const lower = jobDescription.toLowerCase();
  const found = new Set<string>();

  for (const term of [...TECH_VOCAB, ...SOFT_VOCAB]) {
    if (lower.includes(term)) found.add(term);
  }

  const tokens = lower.match(/[a-z+#/]{2,}(?:\.[a-z]+)?/g) ?? [];
  for (const token of tokens) {
    if (token.length >= 3 && !STOPWORDS.has(token)) found.add(token);
  }

  return [...found].slice(0, 30);
}

function detectCompanyNames(jobDescription: string): string[] {
  const companies = new Set<string>();
  const lines = jobDescription
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const first = lines[0];
  if (
    first &&
    first.length <= 60 &&
    !JOB_KEYWORD_REGEX.test(first) &&
    /^[A-ZÀ-Ÿ0-9]/.test(first)
  ) {
    companies.add(first.replace(/\s*(recrute|hiring|jobs?|careers?).*$/i, "").trim());
  }

  const patterns = [
    /\b(?:chez|at|@)\s+([A-ZÀ-Ÿ][\w\s&.'-]{1,45})/g,
    /\b([A-ZÀ-Ÿ][\w\s&.'-]{2,40})\s+(?:recrute|hiring|recherche)\b/g,
  ];

  for (const pattern of patterns) {
    for (const match of jobDescription.matchAll(pattern)) {
      const name = match[1]?.trim();
      if (name && name.length > 2 && !JOB_KEYWORD_REGEX.test(name)) {
        companies.add(name);
      }
    }
  }

  return [...companies].filter((name) => name.length > 2);
}

function sanitizeRole(role: string, companyNames: string[]): string {
  let cleaned = role.trim();

  for (const company of companyNames) {
    cleaned = cleaned.replace(new RegExp(escapeRegex(company), "gi"), "");
  }

  cleaned = cleaned
    .replace(/\b(chez|at|@)\s+[\w\s&.'-]+/gi, "")
    .replace(/^[\s\-:,;|]+|[\s\-:,;|]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned.slice(0, 80);
}

function detectRole(jobDescription: string, companyNames: string[]): string | null {
  const trimmed = jobDescription.trim();
  if (!trimmed) return null;

  for (const pattern of ROLE_TITLE_PATTERNS) {
    const match = trimmed.match(pattern);
    const raw = match?.[1] ?? match?.[0];
    if (!raw) continue;

    const role = sanitizeRole(raw, companyNames);
    if (role.length >= 4 && JOB_KEYWORD_REGEX.test(role)) return role;
  }

  return null;
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

function reorderSkillGroups(groups: CvSkillGroup[], keywords: string[]): CvSkillGroup[] {
  const sortedGroups = sortByRelevance(groups, keywords, (group) =>
    [group.label, ...group.skills.map((s) => s.name)].join(" "),
  );

  return sortedGroups.map((group) => ({
    ...group,
    skills: sortByRelevance(
      group.skills,
      keywords,
      (skill) => `${skill.name} ${skill.level ?? ""}`,
    ),
  }));
}

function collectAllSkillNames(doc: CvDocument): string[] {
  const names: string[] = [];
  for (const group of doc.skillGroups) {
    for (const skill of group.skills) {
      names.push(skill.name);
    }
  }
  return names;
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

function skillMatchesKeyword(skillName: string, keyword: string): boolean {
  const skill = skillName.toLowerCase();
  const kw = keyword.toLowerCase();
  return skill.includes(kw) || kw.includes(skill);
}

function buildHeadline(currentHeadline: string, role: string | null): string {
  if (role && role.length >= 4) return role;
  return currentHeadline;
}

function buildTailoredSummary(
  baseSummary: string,
  matchedSkills: string[],
): string {
  const trimmed = baseSummary.trim();
  if (matchedSkills.length === 0) return trimmed;

  const focus = matchedSkills.slice(0, 5).join(", ");
  const prefix = `Points forts pour ce poste : ${focus}.`;

  if (!trimmed) return prefix;
  if (trimmed.toLowerCase().includes(focus.toLowerCase().slice(0, 12))) {
    return trimmed;
  }

  return `${prefix} ${trimmed}`;
}

function buildRecommendations(
  doc: CvDocument,
  keywords: string[],
  matchedSkills: string[],
): CvTailorRecommendation[] {
  const recommendations: CvTailorRecommendation[] = [];
  const allSkills = collectAllSkillNames(doc);
  const techKeywords = keywords.filter((kw) => TECH_VOCAB.includes(kw));

  for (const skill of matchedSkills.slice(0, 5)) {
    recommendations.push({
      id: createId(),
      kind: "highlight",
      section: "skills",
      message: `« ${skill} » correspond à l'offre : gardez-le en tête de votre CV`,
    });
  }

  const missingTech = techKeywords.filter(
    (kw) => !allSkills.some((skill) => skillMatchesKeyword(skill, kw)),
  );

  for (const kw of missingTech.slice(0, 6)) {
    recommendations.push({
      id: createId(),
      kind: "add",
      section: "skills",
      message: `Ajoutez « ${formatKeyword(kw)} » si vous maîtrisez cette technologie`,
    });
  }

  const lowRelevanceSkills = allSkills.filter(
    (skill) =>
      !keywords.some((kw) => skillMatchesKeyword(skill, kw)) &&
      !matchedSkills.includes(skill),
  );

  for (const skill of lowRelevanceSkills.slice(0, 4)) {
    recommendations.push({
      id: createId(),
      kind: "reduce",
      section: "skills",
      message: `« ${skill} » est peu cité dans l'offre : retirez-le ou placez-le en fin de liste`,
    });
  }

  const topExperience = sortByRelevance(doc.experiences, keywords, (exp) =>
    [exp.role, ...exp.highlights, ...exp.techStack].join(" "),
  )[0];

  if (topExperience) {
    recommendations.push({
      id: createId(),
      kind: "highlight",
      section: "experience",
      message: `Mettez en avant votre expérience « ${topExperience.role} » chez ${topExperience.company}`,
    });
  }

  const weakExperiences = doc.experiences.filter(
    (exp) => keywordScore([exp.role, ...exp.highlights].join(" "), keywords) === 0,
  );

  for (const exp of weakExperiences.slice(0, 2)) {
    recommendations.push({
      id: createId(),
      kind: "reduce",
      section: "experience",
      message: `L'expérience « ${exp.role} » est moins alignée : gardez-la courte ou en fin de CV`,
    });
  }

  const topProject = sortByRelevance(doc.projects, keywords, (proj) =>
    [proj.name, proj.description, ...proj.highlights, ...proj.techStack].join(" "),
  )[0];

  if (topProject && keywordScore(topProject.name + topProject.description, keywords) > 0) {
    recommendations.push({
      id: createId(),
      kind: "highlight",
      section: "projects",
      message: `Le projet « ${topProject.name} » est pertinent : détaillez-le en priorité`,
    });
  }

  const softGaps = SOFT_VOCAB.filter(
    (term) =>
      keywords.includes(term) &&
      !doc.profile.summary.toLowerCase().includes(term) &&
      !doc.experiences.some((exp) =>
        exp.highlights.some((h) => h.toLowerCase().includes(term)),
      ),
  );

  for (const term of softGaps.slice(0, 3)) {
    recommendations.push({
      id: createId(),
      kind: "manual",
      section: "summary",
      message: `L'offre mentionne « ${formatKeyword(term)} » : ajoutez un exemple concret dans votre résumé ou vos expériences`,
    });
  }

  if (missingTech.length > 0) {
    recommendations.push({
      id: createId(),
      kind: "manual",
      section: "general",
      message:
        "Complétez manuellement les missions ou projets où vous avez utilisé les technologies manquantes",
    });
  }

  return recommendations;
}

export function tailorCvForJob(doc: CvDocument, jobDescription: string): TailorCvResult {
  const trimmed = jobDescription.trim();
  if (!trimmed) {
    throw new Error("Collez la description du poste pour adapter le CV");
  }

  const companyNames = detectCompanyNames(trimmed);
  const keywords = extractKeywords(trimmed);
  const role = detectRole(trimmed, companyNames);
  const matchedSkills = collectMatchingSkills(doc, keywords);
  const recommendations = buildRecommendations(doc, keywords, matchedSkills);

  const experiences = sortByRelevance(doc.experiences, keywords, (exp) =>
    [exp.role, ...exp.highlights, ...exp.techStack].join(" "),
  ).map((exp) => ({
    ...exp,
    id: createId(),
    highlights: sortByRelevance(exp.highlights, keywords, (line) => line),
    techStack: sortByRelevance(exp.techStack, keywords, (tech) => tech),
  }));

  const projects = sortByRelevance(doc.projects, keywords, (proj) =>
    [proj.name, proj.description, ...proj.highlights, ...proj.techStack].join(" "),
  ).map((proj) => ({
    ...proj,
    id: createId(),
    highlights: sortByRelevance(proj.highlights, keywords, (line) => line),
    techStack: sortByRelevance(proj.techStack, keywords, (tech) => tech),
  }));

  const skillGroups = reorderSkillGroups(doc.skillGroups, keywords);
  const headline = buildHeadline(doc.profile.headline, role);
  const snippet = trimmed.slice(0, 500);

  const document: CvDocument = {
    ...doc,
    id: undefined,
    title: role ? `CV · ${role.slice(0, 60)}` : `CV · ${doc.title.replace(/^CV ·\s*/, "").slice(0, 60)}`,
    isTailored: true,
    targetJobTitle: role ?? doc.profile.headline,
    jobDescriptionSnippet: snippet,
    tailorRecommendations: recommendations,
    profile: {
      ...doc.profile,
      headline,
      summary: buildTailoredSummary(doc.profile.summary, matchedSkills),
    },
    skillGroups: skillGroups.map((group) => ({ ...group, id: createId() })),
    experiences,
    projects,
    education: doc.education.map((item) => ({ ...item, id: createId() })),
    certifications: doc.certifications.map((item) => ({ ...item, id: createId() })),
    languages: doc.languages.map((item) => ({ ...item, id: createId() })),
    openSource: doc.openSource.map((item) => ({ ...item, id: createId() })),
  };

  return { document, recommendations };
}

export function tailorPreviewHints(
  jobDescription: string,
  doc?: CvDocument,
): {
  role: string | null;
  keywords: string[];
  recommendations: CvTailorRecommendation[];
} {
  const trimmed = jobDescription.trim();
  const companyNames = detectCompanyNames(trimmed);
  const keywords = extractKeywords(trimmed);
  const role = detectRole(trimmed, companyNames);

  const recommendations = doc
    ? buildRecommendations(doc, keywords, collectMatchingSkills(doc, keywords)).slice(0, 6)
    : [];

  return { role, keywords, recommendations };
}
