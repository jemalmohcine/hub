import { ExternalLink } from "lucide-react";
import {
  Badge,
  Card,
  Cluster,
  Heading,
  InlineLink,
  Stack,
  Text,
} from "@/design-system";
import type { BadgeTone } from "@/design-system/components/feedback";
import { SaveButton } from "@/modules/ai-intel/ui/save-button";
import {
  PILLAR_LABELS,
  type AiIntelItem,
  type AiUrgency,
} from "@/modules/ai-intel/types";

const urgencyTone: Record<AiUrgency, BadgeTone> = {
  urgent: "danger",
  medium: "warning",
  light: "neutral",
};

export function FeedItemCard({ item }: { item: AiIntelItem }) {
  const refs = Array.isArray(item.source_refs) ? item.source_refs : [];
  const confirmations = refs.length + 1;

  return (
    <Card className="p-[var(--dh-space-4)]">
      <Stack gap={3}>
        <Cluster gap={2} className="flex-wrap">
          <Badge tone="brand">{PILLAR_LABELS[item.pillar]}</Badge>
          <Badge tone={urgencyTone[item.urgency]}>{item.urgency}</Badge>
          <Badge tone="info">{item.category}</Badge>
          {confirmations > 1 ? (
            <Badge tone="success">Confirmé · {confirmations} sources</Badge>
          ) : null}
        </Cluster>

        <div>
          <Heading level={3} className="text-base leading-snug">
            {item.title}
          </Heading>
          {item.summary ? (
            <Text size="sm" tone="muted" className="mt-[var(--dh-space-2)]">
              {item.summary}
            </Text>
          ) : null}
        </div>

        <Cluster gap={2} className="w-full flex-wrap justify-between">
          <Cluster gap={3} className="flex-wrap">
            <Text size="sm" tone="muted">
              {item.primary_source}
              {item.published_at
                ? ` · ${new Date(item.published_at).toLocaleDateString("fr-FR")}`
                : ""}
            </Text>
            <InlineLink href={item.url}>
              <span className="inline-flex items-center gap-1 text-sm">
                Voir
                <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </InlineLink>
            {refs.slice(0, 3).map((ref) => (
              <InlineLink key={`${ref.sourceId}-${ref.url}`} href={ref.url}>
                {ref.sourceId}
              </InlineLink>
            ))}
          </Cluster>
          <SaveButton itemId={item.id} saved={Boolean(item.saved)} />
        </Cluster>
      </Stack>
    </Card>
  );
}
