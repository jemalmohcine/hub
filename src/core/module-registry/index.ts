import type { LucideIcon } from "lucide-react";
import { Bot, LayoutDashboard } from "lucide-react";
import type { ModuleStatus } from "@/core/auth/types";

export type ModuleDefinition = {
  id: string;
  label: string;
  description: string;
  href: string;
  order: number;
  requiredEntitlement: string | null;
  status: ModuleStatus;
  icon: LucideIcon;
};

export const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    id: "overview",
    label: "Overview",
    description: "Tableau de bord du hub",
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
    href: "/app/ai",
    order: 10,
    requiredEntitlement: "module:ai",
    status: "coming_soon",
    icon: Bot,
  },
];

export function getModuleById(id: string) {
  return MODULE_REGISTRY.find((m) => m.id === id);
}

export function getSortedModules() {
  return [...MODULE_REGISTRY].sort((a, b) => a.order - b.order);
}
