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
    description: "Vos modules en un coup d’œil",
    href: "/app/overview",
    icon: "layout-dashboard",
  },
  {
    id: "ai",
    label: "Veille IA",
    description: "Actualités tech et IA, mises à jour chaque jour",
    href: "/app/ai",
    icon: "bot",
  },
  {
    id: "snippets",
    label: "Snippets",
    description: "Bibliothèque de code et de notes",
    href: "/app/snippets",
    icon: "code",
  },
  {
    id: "profil",
    label: "Profil",
    description: "CV et suivi de candidatures",
    href: "/app/profil",
    icon: "user",
  },
  {
    id: "offres",
    label: "Offres gratuites",
    description: "Crédits, essais gratuits et programmes pro",
    href: "/app/offres",
    icon: "gift",
  },
];

export function useHubModules() {
  return { modules: MODULES };
}
