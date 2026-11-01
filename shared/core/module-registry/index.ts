import type { ModuleStatus } from "~/shared/core/auth/types";
import { ENTITLEMENTS, type EntitlementKey } from "~/shared/core/entitlements/keys";

export type ModuleIconId = "layout-dashboard" | "bot" | "file-text" | "briefcase" | "code" | "piggy-bank";

export type ModuleDefinition = {
  id: ModuleId;
  label: string;
  description: string;
  pageDescription: string;
  upsell: string;
  href: string;
  order: number;
  requiredEntitlement: EntitlementKey | null;
  status: ModuleStatus;
  icon: ModuleIconId;
};

export type ModuleId = "overview" | "ai" | "cv" | "jobs" | "snippets" | "expenses";

export const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    id: "overview",
    label: "Aperçu",
    description: "Tableau de bord du hub",
    pageDescription: "Ce qui a changé depuis ta dernière visite.",
    upsell: "",
    href: "/app/overview",
    order: 0,
    requiredEntitlement: null,
    status: "active",
    icon: "layout-dashboard",
  },
  {
    id: "ai",
    label: "AI",
    description: "Veille modèles, prix, repos et changements",
    pageDescription: "",
    upsell: "Accède au fil d’actualités, aux favoris et aux alertes urgentes.",
    href: "/app/ai",
    order: 10,
    requiredEntitlement: ENTITLEMENTS.ai,
    status: "active",
    icon: "bot",
  },
  {
    id: "cv",
    label: "CV Builder",
    description: "Crée et exporte ton CV développeur",
    pageDescription: "Crée, adapte et exporte ton CV développeur.",
    upsell:
      "Crée plusieurs CV, adapte-les à une offre en un clic et exporte en PDF.",
    href: "/app/career?tab=cv",
    order: 20,
    requiredEntitlement: ENTITLEMENTS.cv,
    status: "active",
    icon: "file-text",
  },
  {
    id: "jobs",
    label: "Candidatures",
    description: "Suivi manuel des candidatures et relances",
    pageDescription: "Note tes candidatures, dates et relances au même endroit que ton CV.",
    upsell: "Centralise entreprises, statuts et rappels de relance sans tableur.",
    href: "/app/career?tab=jobs",
    order: 25,
    requiredEntitlement: ENTITLEMENTS.jobs,
    status: "active",
    icon: "briefcase",
  },
  {
    id: "snippets",
    label: "Snippets",
    description: "Snippets, notes et recherche doc",
    pageDescription: "Tes bouts de code, classés dans tes dossiers.",
    upsell:
      "Range tes snippets dans des dossiers (Personnel, Professionnel…), retrouve-les, et cherche dans la doc.",
    href: "/app/snippets",
    order: 30,
    requiredEntitlement: ENTITLEMENTS.snippets,
    status: "active",
    icon: "code",
  },
  {
    id: "expenses",
    label: "Dépenses dev",
    description: "Budget outils, suivi mensuel et alternatives",
    pageDescription:
      "Services payants, budget mensuel et diagnostic d’alternatives moins chères.",
    upsell:
      "Centralise Vercel, OpenAI, Postgres managé… et compare des alternatives moins chères avec avantages et inconvénients.",
    href: "/app/expenses",
    order: 35,
    requiredEntitlement: ENTITLEMENTS.expenses,
    status: "active",
    icon: "piggy-bank",
  },
];

const BY_ID = new Map(MODULE_REGISTRY.map((mod) => [mod.id, mod]));

export function getModule(id: ModuleId): ModuleDefinition {
  const mod = BY_ID.get(id);
  if (!mod) throw new Error(`Unknown module: ${id}`);
  return mod;
}

export function getModuleById(id: string): ModuleDefinition | undefined {
  return BY_ID.get(id as ModuleId);
}

export function getSortedModules(): ModuleDefinition[] {
  return [...MODULE_REGISTRY].sort((a, b) => a.order - b.order);
}
