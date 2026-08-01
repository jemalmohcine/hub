"use client";

import { useMemo } from "react";
import { buildCvHtml } from "@/modules/cv-builder/export";
import type { CvDocument } from "@/modules/cv-builder/types";

export function CvPreview({ doc }: { doc: CvDocument }) {
  const html = useMemo(() => buildCvHtml(doc), [doc]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-muted/30">
      <iframe
        title="Aperçu CV"
        srcDoc={html}
        className="h-[min(70vh,900px)] w-full bg-white"
        sandbox="allow-same-origin"
      />
    </div>
  );
}
