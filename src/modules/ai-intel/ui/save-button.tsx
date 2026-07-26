"use client";

import { useTransition } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/design-system";
import { toggleAiIntelSave } from "@/modules/ai-intel/actions";
import { cn } from "@/lib/utils";

export function SaveButton({
  itemId,
  saved,
}: {
  itemId: string;
  saved: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Retirer des sauvegardes" : "Sauvegarder"}
      onClick={() => {
        startTransition(async () => {
          await toggleAiIntelSave(itemId);
        });
      }}
    >
      <Bookmark
        className={cn("h-4 w-4", saved && "fill-current")}
      />
      {saved ? "Sauvé" : "Sauver"}
    </Button>
  );
}
