import type { LucideIcon } from "lucide-react";
import { Bot, Briefcase, Code2, FileText, LayoutDashboard, PiggyBank } from "lucide-react";
import type { ModuleStatus } from "@/core/auth/types";
import { ENTITLEMENTS, type EntitlementKey } from "@/core/entitlements/keys";

export type ModuleId = "overview" | "ai" | "cv" | "jobs" | "snippets" | "expenses";

export type ModuleDefinition = {
  id: ModuleId;
  label: string;
  /** One-liner shown in the sidebar and on the overview module cards. */
  description: string;
  /** Longer default subtitle for the module page header. */
  pageDescription: string;
  /** Pitch shown when the user lacks the entitlement. */
  upsell: string;
  href: string;
  order: number;
  requiredEntitlement: EntitlementKey | null;
  status: ModuleStatus;
  icon: LucideIcon;
};

export const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Tableau de bord du hub",
    pageDescription: "Ce qui a changé depuis ta dernière visite.",
    upsell: "",
    href: "/app/overview",
    order: 0,
    requiredEntitlement: null,
    status: "active",
    icon: LayoutDashboard,
  },
  {
    id: "ai",
    label: "AI",
    description: "Veille modèles, prix, repos et changements",
    pageDescription:
      "Urgent = agir. GitHub = repos en tendance. Le reste se lit quand tu as le temps.",
    upsell: "Accède au fil d’actualités, aux favoris et aux alertes urgentes.",
    href: "/app/ai",
    order: 10,
    requiredEntitlement: ENTITLEMENTS.ai,
    status: "active",
    icon: Bot,
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
    icon: FileText,
  },
  {
    id: "jobs",
    label: "Candidatures",
    description: "Offres près de chez toi et suivi des candidatures",
    pageDescription:
      "Postule sur LinkedIn, Indeed et les boards de ton pays — la recherche s’ouvre déjà remplie.",
    upsell:
      "Télétravail et présentiel en même temps : les offres arrivent dès que tu enregistres, puis toutes les 3 heures.",
    href: "/app/career?tab=jobs",
    order: 25,
    requiredEntitlement: ENTITLEMENTS.jobs,
    status: "active",
    icon: Briefcase,
  },
  {
    id: "snippets",
    label: "Snippets",
    description: "Snippets, notes et recherche doc",
    pageDescription: "Tes bouts de code réutilisables et tes notes techniques.",
    upsell:
      "Stocke tes snippets, retrouve-les par langage ou tag, et cherche dans la doc sans quitter le hub.",
    href: "/app/snippets",
    order: 30,
    requiredEntitlement: ENTITLEMENTS.snippets,
    status: "active",
    icon: Code2,
  },
  {
    id: "expenses",
    label: "Dépenses dev",
    description: "Budget stack, suivi mensuel et alternatives",
    pageDescription:
      "Services payants, budget mensuel et diagnostic d’alternatives moins chères.",
    upsell:
      "Centralise Vercel, OpenAI, Supabase… et compare des alternatives moins chères avec avantages et inconvénients.",
    href: "/app/expenses",
    order: 35,
    requiredEntitlement: ENTITLEMENTS.expenses,
    status: "active",
    icon: PiggyBank,
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
