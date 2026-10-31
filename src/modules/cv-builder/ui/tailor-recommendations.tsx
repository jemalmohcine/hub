"use client";

import { CheckCircle2, MinusCircle, PlusCircle, Sparkles } from "lucide-react";
import { Card, Stack, Text } from "@/design-system";
import type { CvTailorRecommendation } from "@/modules/cv-builder/types";
import { cn } from "@/lib/utils";

const KIND_META = {
  highlight: {
    label: "À mettre en avant",
    icon: CheckCircle2,
    tone: "text-emerald-600 dark:text-emerald-400",
  },
  add: {
    label: "À ajouter si vous l'avez",
    icon: PlusCircle,
    tone: "text-primary",
  },
  reduce: {
    label: "À réduire ou retirer",
    icon: MinusCircle,
    tone: "text-amber-600 dark:text-amber-400",
  },
  manual: {
    label: "À compléter vous-même",
    icon: Sparkles,
    tone: "text-muted-foreground",
  },
} as const;

export function TailorRecommendationsPanel({
  recommendations,
  title = "Recommandations pour ce poste",
  compact = false,
}: {
  recommendations: CvTailorRecommendation[];
  title?: string;
  compact?: boolean;
}) {
  if (recommendations.length === 0) return null;

  const grouped = (["highlight", "add", "reduce", "manual"] as const).map((kind) => ({
    kind,
    items: recommendations.filter((item) => item.kind === kind),
  }));

  return (
    <Card className={cn("p-4", compact && "p-3")}>
      <Stack gap={3}>
        <Text weight="medium" size={compact ? "sm" : "md"}>
          {title}
        </Text>
        {grouped.map(({ kind, items }) => {
          if (items.length === 0) return null;
          const meta = KIND_META[kind];
          const Icon = meta.icon;
          return (
            <Stack key={kind} gap={2}>
              <div className={cn("flex items-center gap-2 text-sm font-medium", meta.tone)}>
                <Icon className="h-4 w-4 shrink-0" />
                <span>{meta.label}</span>
              </div>
              <ul className="space-y-1.5 pl-6">
                {items.map((item) => (
                  <li key={item.id} className="text-sm text-muted-foreground">
                    {item.message}
                  </li>
                ))}
              </ul>
            </Stack>
          );
        })}
      </Stack>
    </Card>
  );
}
