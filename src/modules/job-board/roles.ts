import { foldCase } from "@/lib/text";

export type JobRole = {
  id: string;
  label: string;
  aliases: string[];
};

export const MAX_JOB_ROLES = 8;

const ROLES: JobRole[] = [
  { id: "frontend", label: "Développeur frontend", aliases: ["front end", "front-end", "react", "vue", "angular"] },
  { id: "backend", label: "Développeur backend", aliases: ["back end", "back-end", "api", "node", "java", "php"] },
  { id: "fullstack", label: "Développeur full stack", aliases: ["full-stack", "full stack", "fullstack"] },
  { id: "software-engineer", label: "Software engineer", aliases: ["ingénieur logiciel", "ingenieur logiciel", "swe"] },
  { id: "tech-lead", label: "Tech lead", aliases: ["technical lead", "lead dev", "lead developer"] },
  { id: "engineering-manager", label: "Engineering manager", aliases: ["em", "manager engineering", "head of engineering"] },
  { id: "devops", label: "DevOps / SRE", aliases: ["sre", "platform engineer", "site reliability"] },
  { id: "data-engineer", label: "Data engineer", aliases: ["ingénieur data", "data eng"] },
  { id: "data-scientist", label: "Data scientist", aliases: ["scientifique des données"] },
  { id: "ml-engineer", label: "Machine learning engineer", aliases: ["ml", "ia", "ai engineer", "llm"] },
  { id: "mobile", label: "Développeur mobile", aliases: ["ios", "android", "react native", "flutter"] },
  { id: "qa", label: "QA / Test", aliases: ["quality", "testeur", "sdet", "automation"] },
  { id: "cloud", label: "Cloud / Architecte", aliases: ["aws", "gcp", "azure", "solutions architect"] },
  { id: "cyber", label: "Cybersécurité", aliases: ["security", "soc", "appsec"] },
  { id: "product-manager", label: "Product manager", aliases: ["pm", "chef de produit", "product owner", "po"] },
  { id: "product-designer", label: "Product designer", aliases: ["ux", "ui", "ux/ui", "designer"] },
  { id: "data-analyst", label: "Data analyst", aliases: ["analyste data", "bi"] },
  { id: "cto", label: "CTO", aliases: ["chief technology officer", "directeur technique"] },
  { id: "scrum", label: "Scrum master", aliases: ["agile coach"] },
  { id: "support", label: "Support / Customer success", aliases: ["customer success", "csm"] },
];

const BY_ID = new Map(ROLES.map((role) => [role.id, role]));

export const JOB_ROLES = ROLES;

export function resolveRole(raw: string): JobRole {
  const trimmed = raw.trim();
  const folded = foldCase(trimmed);
  if (!folded) {
    return { id: "fullstack", label: "Développeur full stack", aliases: [] };
  }
  const exact = BY_ID.get(folded);
  if (exact) return exact;
  const aliased = ROLES.find(
    (role) =>
      foldCase(role.label) === folded ||
      role.aliases.some((alias) => foldCase(alias) === folded),
  );
  if (aliased) return aliased;
  const prefix = ROLES.find((role) => {
    const label = foldCase(role.label);
    if (folded.startsWith(label) || label.startsWith(folded)) return true;
    return role.aliases.some((alias) => {
      const key = foldCase(alias);
      return folded.startsWith(key) || key.startsWith(folded);
    });
  });
  if (prefix && folded.length >= 4) return prefix;
  return { id: folded, label: trimmed, aliases: [] };
}

export function resolveRoles(ids: string[]): JobRole[] {
  const seen = new Set<string>();
  const resolved: JobRole[] = [];
  for (const id of ids) {
    const role = resolveRole(id);
    if (seen.has(role.id)) continue;
    seen.add(role.id);
    resolved.push(role);
    if (resolved.length >= MAX_JOB_ROLES) break;
  }
  return resolved;
}

function scoreRole(role: JobRole, query: string): number {
  const folded = foldCase(query);
  if (!folded) return 0;
  const label = foldCase(role.label);
  if (label === folded || role.id === folded) return 100;
  if (role.aliases.some((alias) => foldCase(alias) === folded)) return 90;
  if (label.startsWith(folded) || role.id.startsWith(folded)) return 80;
  if (role.aliases.some((alias) => foldCase(alias).startsWith(folded))) return 70;
  if (label.includes(folded) || role.id.includes(folded)) return 50;
  if (role.aliases.some((alias) => foldCase(alias).includes(folded))) return 40;
  return 0;
}

export function suggestRoles(
  query: string,
  selectedIds: string[] = [],
  limit = 8,
): JobRole[] {
  const selected = new Set(selectedIds.map((id) => resolveRole(id).id));
  const folded = foldCase(query);
  const pool = folded
    ? ROLES.filter((role) => !selected.has(role.id))
        .map((role) => ({ role, score: scoreRole(role, query) }))
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score || a.role.label.localeCompare(b.role.label, "fr"))
        .map((row) => row.role)
    : ROLES.filter((role) => !selected.has(role.id));
  return pool.slice(0, limit);
}

export function rolesToQuery(roles: string[]): string {
  return resolveRoles(roles)
    .map((role) => role.label)
    .join(" ");
}
