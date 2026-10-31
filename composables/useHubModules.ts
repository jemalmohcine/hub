export type HubModuleId = "overview" | "ai" | "snippets" | "profil" | "offres";

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
    description: "Tableau de bord du hub",
    href: "/app/overview",
    icon: "layout-dashboard",
  },
  {
    id: "ai",
    label: "Veille IA",
    description: "Fil quotidien dev et IA",
    href: "/app/ai",
    icon: "bot",
  },
  {
    id: "snippets",
    label: "Snippets",
    description: "Code et notes",
    href: "/app/snippets",
    icon: "code",
  },
  {
    id: "profil",
    label: "Profil",
    description: "CV et candidatures",
    href: "/app/profil",
    icon: "user",
  },
  {
    id: "offres",
    label: "Offres gratuites",
    description: "Crédits, tiers free et programmes dev",
    href: "/app/offres",
    icon: "gift",
  },
];

export function useHubModules() {
  return { modules: MODULES };
}
