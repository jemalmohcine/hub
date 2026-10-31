import { foldCase } from "@/lib/text";

export type CategoryHint = {
  title: string;
  content: string;
  language: string | null;
  tags: string[];
};

export const DEFAULT_SNIPPET_CATEGORY = "Général";

/** Topics the offline classifier can name without an LLM. */
const TOPIC_CATEGORIES: Array<{ name: string; tokens: string[] }> = [
  { name: "Docker", tokens: ["docker", "dockerfile", "compose", "container"] },
  { name: "Kubernetes", tokens: ["kubernetes", "k8s", "kubectl", "helm"] },
  { name: "PostgreSQL", tokens: ["postgres", "postgresql", "psql"] },
  { name: "MySQL", tokens: ["mysql", "mariadb"] },
  { name: "Redis", tokens: ["redis"] },
  { name: "MongoDB", tokens: ["mongodb", "mongoose"] },
  { name: "Next.js", tokens: ["nextjs", "next.js"] },
  { name: "React", tokens: ["react", "jsx", "useeffect", "usestate"] },
  { name: "Git", tokens: ["github", "gitlab", "gitignore"] },
  { name: "CI/CD", tokens: ["github actions", "gitlab-ci", "ci/cd"] },
  { name: "Linux", tokens: ["linux", "systemd", "ubuntu"] },
  { name: "CSS", tokens: ["tailwind", "flexbox", "grid"] },
];

const LANGUAGE_CATEGORIES: Record<string, string> = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  python: "Python",
  bash: "Bash",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  yaml: "YAML",
  docker: "Docker",
  go: "Go",
  rust: "Rust",
  java: "Java",
  php: "PHP",
};

export function normalizeCategoryName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, 40);
}

export function matchExistingCategory(
  proposed: string,
  existing: string[],
): string | null {
  const key = foldCase(normalizeCategoryName(proposed));
  if (!key) return null;
  return existing.find((name) => foldCase(name) === key) ?? null;
}

function haystack(hint: CategoryHint): string {
  return foldCase(
    [hint.title, hint.tags.join(" "), hint.language ?? "", hint.content].join(" "),
  );
}

function scoreExisting(name: string, hay: string): number {
  const folded = foldCase(name);
  if (folded.length < 2) return 0;
  if (hay.includes(folded)) return 100 + folded.length;
  const tokens = folded.split(/[^a-z0-9]+/).filter((token) => token.length >= 2);
  if (tokens.length === 0) return 0;
  const hits = tokens.filter((token) => hay.includes(token));
  if (hits.length === 0) return 0;
  return (hits.length / tokens.length) * 40 + hits.join("").length;
}

/**
 * Name a category from the snippet itself. Prefers an existing label so the
 * library does not explode into near-duplicates. Load-bearing when the LLM
 * is missing or throttled.
 */
export function classifyCategoryLocal(
  hint: CategoryHint,
  existing: string[],
): string {
  const hay = haystack(hint);

  let bestExisting: { name: string; score: number } | null = null;
  for (const name of existing) {
    const score = scoreExisting(name, hay);
    if (score < 40) continue;
    if (!bestExisting || score > bestExisting.score) {
      bestExisting = { name, score };
    }
  }
  if (bestExisting) return bestExisting.name;

  for (const topic of TOPIC_CATEGORIES) {
    if (topic.tokens.some((token) => hay.includes(token))) {
      return matchExistingCategory(topic.name, existing) ?? topic.name;
    }
  }

  const language = (hint.language ?? "").trim().toLowerCase();
  const fromLanguage = LANGUAGE_CATEGORIES[language];
  if (fromLanguage) {
    return matchExistingCategory(fromLanguage, existing) ?? fromLanguage;
  }

  return (
    matchExistingCategory(DEFAULT_SNIPPET_CATEGORY, existing) ??
    DEFAULT_SNIPPET_CATEGORY
  );
}
