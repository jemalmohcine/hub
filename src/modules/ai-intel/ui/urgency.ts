import type { BadgeTone } from "@/design-system/components/feedback";
import type { AiUrgency } from "@/modules/ai-intel/types";

export const urgencyTone: Record<AiUrgency, BadgeTone> = {
  urgent: "danger",
  medium: "warning",
  light: "neutral",
};
