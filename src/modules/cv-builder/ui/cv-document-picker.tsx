"use client";

import { Copy, FilePlus, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Cluster,
  Stack,
  Text,
} from "@/design-system";
import type { CvDocument, CvDocumentSummary } from "@/modules/cv-builder/types";
import { cn } from "@/lib/utils";

export function CvDocumentPicker({
  documents,
  activeId,
  onSelect,
  onCreate,
  onDuplicate,
  onDelete,
  disabled,
}: {
  documents: CvDocumentSummary[];
  activeId: string | undefined;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <Card className="p-4">
      <Cluster gap={2} className="mb-3 justify-between">
        <Text weight="medium">Mes CV</Text>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={onCreate}
        >
          <FilePlus className="h-4 w-4" />
          Nouveau
        </Button>
      </Cluster>

      {documents.length === 0 ? (
        <Text size="sm" tone="muted">
          Aucun CV sauvegardé. Créez votre premier CV.
        </Text>
      ) : (
        <Stack gap={1}>
          {documents.map((item) => {
            const active = item.id === activeId;
            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors",
                  active
                    ? "border-foreground bg-muted/60"
                    : "border-transparent hover:bg-muted/40",
                )}
              >
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onSelect(item.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <Text size="sm" weight={active ? "medium" : "regular"} className="truncate">
                    {item.title}
                  </Text>
                  <Cluster gap={2} className="mt-0.5">
                    {item.isTailored ? (
                      <Badge tone="info" className="text-[length:var(--dh-text-2xs)]">
                        Adapté
                      </Badge>
                    ) : null}
                    {item.targetJobTitle ? (
                      <Text size="sm" tone="muted" className="truncate text-xs">
                        {item.targetJobTitle}
                      </Text>
                    ) : null}
                  </Cluster>
                </button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => onDuplicate(item.id)}
                  aria-label="Dupliquer"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={disabled || documents.length <= 1}
                  onClick={() => onDelete(item.id)}
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </Stack>
      )}
    </Card>
  );
}

export function cvSummaryFromDoc(doc: CvDocument): CvDocumentSummary | null {
  if (!doc.id) return null;
  return {
    id: doc.id,
    title: doc.title,
    themeId: doc.themeId,
    isTailored: doc.isTailored ?? false,
    targetJobTitle: doc.targetJobTitle ?? null,
    updatedAt: new Date().toISOString(),
  };
}
