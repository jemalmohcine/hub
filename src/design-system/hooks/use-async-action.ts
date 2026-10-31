"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/design-system/components/toast";

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return fallback;
}

export type AsyncActionMessages<T> = {
  success?: string | ((result: T) => string);
  error?: string | ((err: unknown) => string);
  warning?: string;
  info?: string;
  silent?: boolean;
  onSuccess?: (result: T) => void;
  onError?: (err: unknown) => void;
};

export function useAsyncAction() {
  const toast = useToast();
  const [pending, setPending] = useState(false);

  const run = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      messages?: AsyncActionMessages<T>,
    ): Promise<T | undefined> => {
      setPending(true);
      try {
        const result = await fn();
        if (!messages?.silent) {
          if (messages?.success) {
            const text =
              typeof messages.success === "function"
                ? messages.success(result)
                : messages.success;
            toast.success(text);
          } else if (messages?.info) {
            toast.info(messages.info);
          }
        }
        messages?.onSuccess?.(result);
        return result;
      } catch (err) {
        if (!messages?.silent) {
          const text =
            typeof messages?.error === "function"
              ? messages.error(err)
              : messages?.error ?? errorMessage(err, "Une erreur est survenue");
          toast.error(text);
        }
        messages?.onError?.(err);
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [toast],
  );

  return { run, pending };
}
