"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import {
  Button,
  Cluster,
  IconButton,
  Input,
  Label,
  Stack,
  Text,
} from "@/design-system";
import { compressSnippetImage } from "@/modules/dev-snippets/compress-image";

export function SnippetImageField({
  value,
  onChange,
  onError,
}: {
  value: string;
  onChange: (next: string) => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  const attachFile = useCallback(
    async (file: File | null) => {
      if (!file) return;
      setPending(true);
      try {
        const dataUrl = await compressSnippetImage(file);
        onChange(dataUrl);
      } catch (err) {
        onError(err instanceof Error ? err.message : "Impossible de lire l’image.");
      } finally {
        setPending(false);
        if (inputRef.current) {
          inputRef.current.value = "";
          inputRef.current.blur();
        }
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }
    },
    [onChange, onError],
  );

  useEffect(() => {
    function onPaste(event: ClipboardEvent) {
      const file = imageFileFromClipboard(event.clipboardData);
      if (!file) return;
      const text = event.clipboardData?.getData("text/plain")?.trim();
      const target = event.target;
      const inField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement;
      if (inField && text) return;
      event.preventDefault();
      void attachFile(file);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [attachFile]);

  return (
    <Stack gap={2}>
      <Label htmlFor="snippet-image-file">Image</Label>
      <Text size="sm" tone="muted">
        Capture d’écran, schéma, ou lien. Tu peux aussi coller (Ctrl+V / Cmd+V).
      </Text>
      {value ? (
        <div className="relative h-36 max-h-[30vh] overflow-hidden rounded-xl border border-border bg-muted/40">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URLs and arbitrary user URLs */}
          <img
            src={value}
            alt="Aperçu de l’image du snippet"
            className="h-full w-full object-contain"
          />
          <IconButton
            type="button"
            label="Retirer l’image"
            size="sm"
            variant="ghost"
            className="absolute top-2 right-2 bg-background/90"
            onClick={() => onChange("")}
          >
            <X className="h-4 w-4" />
          </IconButton>
        </div>
      ) : null}
      <Cluster gap={2} className="flex-wrap">
        <input
          ref={inputRef}
          id="snippet-image-file"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="pointer-events-none fixed top-0 left-0 h-px w-px opacity-0"
          onChange={(event) => void attachFile(event.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImagePlus className="h-3.5 w-3.5" />
          )}
          {value ? "Remplacer l’image" : "Joindre une image"}
        </Button>
      </Cluster>
      <Input
        id="snippet-image-url"
        value={value.startsWith("data:") ? "" : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ou un lien https://…"
        disabled={pending || value.startsWith("data:")}
      />
    </Stack>
  );
}

function imageFileFromClipboard(data: DataTransfer | null): File | null {
  if (!data) return null;
  const fromItems = [...data.items]
    .find((item) => item.type.startsWith("image/"))
    ?.getAsFile();
  if (fromItems) return fromItems;
  return [...data.files].find((file) => file.type.startsWith("image/")) ?? null;
}
