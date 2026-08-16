"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { Button, Card, Cluster, Stack, Text } from "@/design-system";
import { cvReadiness } from "@/modules/cv-builder/readiness";
import type { CvDocument } from "@/modules/cv-builder/types";
import type { CvFormSection } from "@/modules/cv-builder/ui/cv-form";

export function CvReadinessCard({
  doc,
  onJump,
}: {
  doc: CvDocument;
  onJump: (section: CvFormSection) => void;
}) {
  const readiness = cvReadiness(doc);

  return (
    <Card className="p-4">
      <Stack gap={3}>
        <Cluster gap={2} className="justify-between">
          <Text weight="medium">Prêt pour les offres</Text>
          <Text size="sm" tone="muted">
            {readiness.score}/100
          </Text>
        </Cluster>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-[var(--dh-brand)]"
            style={{ width: `${readiness.score}%` }}
          />
        </div>
        <Text size="sm" tone="muted">
          {readiness.summary}
        </Text>
        {readiness.hints.map((hint) => (
          <button
            key={hint.id}
            type="button"
            onClick={() => onJump(hint.section)}
            className="flex items-center gap-2 text-left text-[length:var(--dh-text-sm)] text-muted-foreground hover:text-foreground"
          >
            <Circle className="h-3.5 w-3.5 shrink-0" />
            {hint.label}
          </button>
        ))}
        {readiness.ready ? (
          <Cluster gap={2} className="items-center">
            <CheckCircle2 className="h-4 w-4 text-[var(--dh-brand)]" />
            <Button asChild size="sm">
              <a href="/app/career?tab=offers">Voir les offres</a>
            </Button>
          </Cluster>
        ) : null}
      </Stack>
    </Card>
  );
}
