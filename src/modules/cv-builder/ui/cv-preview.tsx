"use client";

import { useMemo } from "react";
import { buildCvHtml } from "@/modules/cv-builder/export";
import type { CvDocument } from "@/modules/cv-builder/types";
import { cn } from "@/lib/utils";

export function CvPreview({
  doc,
  className,
}: {
  doc: CvDocument;
  className?: string;
}) {
  const html = useMemo(() => buildCvHtml(doc), [doc]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-muted/30">
      <iframe
        title="Aperçu CV"
        srcDoc={html}
        className={cn("h-[min(70vh,900px)] w-full bg-white", className)}
        sandbox="allow-same-origin"
      />
    </div>
  );
}
