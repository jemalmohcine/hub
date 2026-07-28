"use client";

import { useTransition } from "react";
import { Bookmark } from "lucide-react";
import { Button } from "@/design-system";
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
  const [pending, startTransition] = useTransition();
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
        startTransition(async () => {
          await toggleAiIntelSave(itemId);
        });
      }}
    >
      <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
      {saved ? copy.savedBtn : copy.save}
    </Button>
  );
}
