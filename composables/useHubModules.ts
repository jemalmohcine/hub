export type HubModuleId = "overview" | "ai" | "career" | "snippets" | "expenses";

export type HubModule = {
  id: HubModuleId;
  label: string;
  description: string;
  href: string;
  icon: string;
};

const MODULES: HubModule[] = [
  {
    id: "overview",
    label: "Aperçu",
    description: "Vos modules en un coup d’œil",
    href: "/app/overview",
    icon: "layout-dashboard",
  },
  {
    id: "ai",
    label: "Veille IA",
    description: "Actualités tech et IA, filtrées sur les sept derniers jours",
    href: "/app/ai",
    icon: "sparkles",
  },
  {
    id: "career",
    label: "Carrière",
    description: "CV exportable et suivi de candidatures",
    href: "/app/career",
    icon: "briefcase",
  },
  {
    id: "snippets",
    label: "Snippets",
    description: "Bibliothèque de code et de notes",
    href: "/app/snippets",
    icon: "code",
  },
  {
    id: "expenses",
    label: "Budget outils",
    description: "Dépenses récurrentes et catalogue d’outils",
    href: "/app/expenses",
    icon: "piggy-bank",
  },
];

export function useHubModules() {
  return { modules: MODULES };
}
