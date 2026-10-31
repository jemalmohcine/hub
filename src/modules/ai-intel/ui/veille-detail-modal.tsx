"use client";

import { ExternalLink } from "lucide-react";
import {
  Button,
  Dialog,
  Stack,
  Text,
} from "@/design-system";
import {
  VEILLE_CATEGORY_LABELS,
  VEILLE_PROVIDER_LABELS,
} from "@/modules/ai-intel/veille/labels";
import { VeilleSaveButton } from "@/modules/ai-intel/ui/veille-save-button";
import type { VeilleItem } from "@/modules/ai-intel/veille/types";
import { formatCompactNumber } from "@/lib/numbers";

function bulletLines(text: string): string[] {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^[\s•\-–]+/, "").trim())
    .filter(Boolean);
}

export function VeilleDetailModal({
  item,
  open,
  onOpenChange,
  onSavedChange,
}: {
  item: VeilleItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSavedChange: (itemId: string, saved: boolean) => void;
}) {
  if (!item) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange} title="Détail">
        <Text tone="muted">Élément introuvable.</Text>
      </Dialog>
    );
  }

  const quoi = bulletLines(item.quoi);
  const impact = bulletLines(item.impact);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={item.title}
      description={VEILLE_CATEGORY_LABELS[item.category]}
    >
      <Stack gap={4}>
        <Text className="leading-relaxed">{item.summary}</Text>

        {quoi.length > 0 ? (
          <Stack gap={2}>
            <Text weight="medium">Quoi</Text>
            <ul className="list-disc space-y-1 pl-5 text-[length:var(--dh-text-sm)] text-muted-foreground">
              {quoi.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Stack>
        ) : null}

        {impact.length > 0 ? (
          <Stack gap={2}>
            <Text weight="medium">Impact pour toi</Text>
            <ul className="list-disc space-y-1 pl-5 text-[length:var(--dh-text-sm)]">
              {impact.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Stack>
        ) : null}

        {(item.affected_versions.length > 0 ||
          item.fixed_versions.length > 0 ||
          item.stars_week != null ||
          item.stars_month != null ||
          item.price_info) && (
          <Stack gap={2}>
            <Text weight="medium" size="sm" tone="muted">
              Informations
            </Text>
            <div className="space-y-1 text-[length:var(--dh-text-sm)] text-muted-foreground">
              {item.affected_versions.length > 0 ? (
                <p>
                  Versions concernées :{" "}
                  {item.affected_versions.join(", ")}
                </p>
              ) : null}
              {item.fixed_versions.length > 0 ? (
                <p>Corrigé en : {item.fixed_versions.join(", ")}</p>
              ) : null}
              {item.stars_week != null ? (
                <p>+{formatCompactNumber(item.stars_week)} ★ / semaine</p>
              ) : null}
              {item.stars_month != null ? (
                <p>+{formatCompactNumber(item.stars_month)} ★ / mois</p>
              ) : null}
              {item.price_info ? <p>{item.price_info}</p> : null}
              <p>Fournisseur : {VEILLE_PROVIDER_LABELS[item.provider]}</p>
            </div>
          </Stack>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            onClick={() =>
              window.open(item.link, "_blank", "noopener,noreferrer")
            }
          >
            Voir la source
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
          <VeilleSaveButton
            itemId={item.id}
            saved={Boolean(item.saved)}
            onSavedChange={onSavedChange}
          />
        </div>
      </Stack>
    </Dialog>
  );
}
