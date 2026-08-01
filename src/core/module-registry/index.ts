import type { LucideIcon } from "lucide-react";
import { Bot, FileText, LayoutDashboard } from "lucide-react";
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
    status: "active",
    icon: Bot,
  },
  {
    id: "cv",
    label: "CV Builder",
    description: "Crée et exporte ton CV développeur",
    href: "/app/cv",
    order: 20,
    requiredEntitlement: "module:cv",
    status: "active",
    icon: FileText,
  },
];

export function getModuleById(id: string) {
  return MODULE_REGISTRY.find((m) => m.id === id);
}

export function getSortedModules() {
  return [...MODULE_REGISTRY].sort((a, b) => a.order - b.order);
}
