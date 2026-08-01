"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/design-system/components/toast";

type ActionResult = { ok: true } | { ok: false; error: string } | null;

export function useActionToast(
  state: ActionResult,
  messages?: {
    success?: string;
    error?: string;
  },
) {
  const toast = useToast();
  const seen = useRef<ActionResult>(null);

  useEffect(() => {
    if (!state || state === seen.current) return;
    seen.current = state;

    if (state.ok) {
      if (messages?.success) toast.success(messages.success);
      return;
    }

    toast.error(messages?.error ?? state.error);
  }, [state, messages?.success, messages?.error, toast]);
}
