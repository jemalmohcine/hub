"use client";

import { Bookmark, Loader2 } from "lucide-react";
import { Button, useAsyncAction } from "@/design-system";
import { toggleAiIntelSave } from "@/modules/ai-intel/actions";
import type { AiLocale } from "@/modules/ai-intel/i18n/locale";
import { t } from "@/modules/ai-intel/i18n/locale";
import { cn } from "@/lib/utils";

export function SaveButton({
  itemId,
  saved,
  locale = "fr",
}: {
  itemId: string;
  saved: boolean;
  locale?: AiLocale;
}) {
  const { run, pending } = useAsyncAction();
  const copy = t(locale);

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? copy.savedBtn : copy.save}
      onClick={() => {
        void run(() => toggleAiIntelSave(itemId), {
          success: saved ? "Retiré des favoris" : "Ajouté aux favoris",
          error: "Impossible de mettre à jour les favoris",
        });
      }}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
      )}
      {saved ? copy.savedBtn : copy.save}
    </Button>
  );
}
