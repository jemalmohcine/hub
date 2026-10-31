"use client";

import { Bookmark } from "lucide-react";
import { IconButton, useAsyncAction } from "@/design-system";
import { toggleVeilleSave } from "@/modules/ai-intel/veille-actions";

export function VeilleSaveButton({
  itemId,
  saved,
  onSavedChange,
}: {
  itemId: string;
  saved: boolean;
  onSavedChange: (itemId: string, saved: boolean) => void;
}) {
  const { run, pending } = useAsyncAction();

  return (
    <IconButton
      type="button"
      variant={saved ? "secondary" : "ghost"}
      size="sm"
      disabled={pending}
      label={saved ? "Retirer des sauvegardés" : "Sauvegarder"}
      onClick={() => {
        void run(async () => {
          const next = await toggleVeilleSave(itemId);
          onSavedChange(itemId, next.saved);
        });
      }}
    >
      <Bookmark
        className={saved ? "fill-current text-[var(--dh-brand)]" : undefined}
      />
    </IconButton>
  );
}
