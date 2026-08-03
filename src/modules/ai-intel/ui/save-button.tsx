"use client";

import { useEffect, useState } from "react";
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
  onSavedChange,
}: {
  itemId: string;
  saved: boolean;
  locale?: AiLocale;
  onSavedChange?: (saved: boolean) => void;
}) {
  const { run, pending } = useAsyncAction();
  const copy = t(locale);
  const [isSaved, setIsSaved] = useState(saved);

  useEffect(() => {
    setIsSaved(saved);
  }, [saved, itemId]);

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={pending}
      aria-pressed={isSaved}
      aria-label={isSaved ? copy.savedBtn : copy.save}
      onClick={() => {
        const previous = isSaved;
        const optimistic = !previous;
        setIsSaved(optimistic);
        onSavedChange?.(optimistic);

        void run(() => toggleAiIntelSave(itemId), {
          success: optimistic ? "Ajouté aux favoris" : "Retiré des favoris",
          error: "Impossible d’enregistrer",
          onSuccess: (result) => {
            setIsSaved(result.saved);
            onSavedChange?.(result.saved);
          },
          onError: () => {
            setIsSaved(previous);
            onSavedChange?.(previous);
          },
        });
      }}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
      )}
      {isSaved ? copy.savedBtn : copy.save}
    </Button>
  );
}
