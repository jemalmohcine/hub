export type HubModuleId = "overview" | "ai" | "career" | "snippets" | "expenses";

export type HubModule = {
  id: HubModuleId;
  label: string;
  description: string;
  href: string;
  icon: string;
};

/** Aligné sur le registre Next (`0ba91f23`). */
const MODULES: HubModule[] = [
  {
    id: "overview",
    label: "Aperçu",
    description: "Ce qui compte depuis votre dernière visite",
    href: "/app/overview",
    icon: "layout-dashboard",
  },
  {
    id: "ai",
    label: "Veille IA",
    description: "Modèles, prix, repos et changements produits",
    href: "/app/ai",
    icon: "bot",
  },
  {
    id: "career",
    label: "Carrière",
    description: "CV, export et suivi des candidatures",
    href: "/app/career?tab=cv",
    icon: "briefcase",
  },
  {
    id: "snippets",
    label: "Snippets",
    description: "Code, notes et recherche doc",
    href: "/app/snippets",
    icon: "code",
  },
  {
    id: "expenses",
    label: "Dépenses dev",
    description: "Budget outils et catalogue d’alternatives",
    href: "/app/expenses",
    icon: "piggy-bank",
  },
];

export function useHubModules() {
  return { modules: MODULES };
}
