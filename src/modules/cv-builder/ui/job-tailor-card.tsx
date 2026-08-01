"use client";

import { useMemo, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Cluster,
  Label,
  Stack,
  Text,
  Textarea,
  useAsyncAction,
} from "@/design-system";
import { tailorCvFromJobDescription } from "@/modules/cv-builder/actions";
import { tailorPreviewHints } from "@/modules/cv-builder/tailor";
import type { CvDocument } from "@/modules/cv-builder/types";

export function JobTailorCard({
  sourceDoc,
  onTailored,
}: {
  sourceDoc: CvDocument;
  onTailored: (doc: CvDocument) => void;
}) {
  const [jobText, setJobText] = useState("");
  const { run, pending } = useAsyncAction();

  const hints = useMemo(() => tailorPreviewHints(jobText), [jobText]);

  function handleTailor() {
    if (!sourceDoc.id) return;
    void run(
      () => tailorCvFromJobDescription(sourceDoc.id!, jobText),
      {
        success: "CV adapté au poste et sauvegardé",
        error: "Impossible d'adapter le CV",
        onSuccess: (doc) => {
          onTailored(doc);
          setJobText("");
        },
      },
    );
  }

  return (
    <Card className="p-4">
      <Stack gap={3}>
        <div>
          <Cluster gap={2}>
            <Sparkles className="h-4 w-4 text-primary" />
            <Text weight="medium">Adapter au poste</Text>
          </Cluster>
          <Text size="sm" tone="muted" className="mt-1">
            Collez l&apos;offre d&apos;emploi : le CV sera optimisé (titre, résumé,
            compétences et expériences) pour maximiser vos chances.
          </Text>
        </div>

        <div>
          <Label htmlFor="job-description">Description du poste</Label>
          <Textarea
            id="job-description"
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="Collez ici l'intégralité de l'offre : missions, stack technique, profil recherché…"
            rows={6}
            disabled={pending}
          />
        </div>

        {jobText.trim().length > 40 ? (
          <Cluster gap={2} className="flex-wrap">
            {hints.role ? (
              <Badge tone="neutral">Poste : {hints.role.slice(0, 50)}</Badge>
            ) : null}
            {hints.keywords.slice(0, 5).map((kw) => (
              <Badge key={kw} tone="info">
                {kw}
              </Badge>
            ))}
          </Cluster>
        ) : null}

        <Button
          type="button"
          disabled={pending || !sourceDoc.id || jobText.trim().length < 40}
          onClick={handleTailor}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {pending ? "Adaptation en cours…" : "Générer un CV parfait pour ce poste"}
        </Button>
      </Stack>
    </Card>
  );
}
