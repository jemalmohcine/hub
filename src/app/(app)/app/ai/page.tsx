import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Bot, Lock } from "lucide-react";
import { getHubUser } from "@/core/auth/get-user";
import { hasEntitlement } from "@/core/entitlements";
import {
  Atmosphere,
  Badge,
  Card,
  Cluster,
  Heading,
  IconBox,
  LinkButton,
  PageHeader,
  Stack,
  Text,
} from "@/design-system";
import {
  getAiIntelFeed,
  getLatestAiIntelRun,
  parseFeedFilters,
} from "@/modules/ai-intel/queries";
import { FeedFilters } from "@/modules/ai-intel/ui/feed-filters";
import { FeedItemCard } from "@/modules/ai-intel/ui/feed-item-card";

export const metadata = { title: "AI" };

export default async function AiModulePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  const entitled = hasEntitlement(user.entitlements, "module:ai");
  const params = await searchParams;
  const filters = parseFeedFilters({
    pillar: typeof params.pillar === "string" ? params.pillar : undefined,
    urgency: typeof params.urgency === "string" ? params.urgency : undefined,
    category: typeof params.category === "string" ? params.category : undefined,
    saved: typeof params.saved === "string" ? params.saved : undefined,
    q: typeof params.q === "string" ? params.q : undefined,
  });

  if (!entitled) {
    return (
      <>
        <PageHeader
          title="AI Intelligence"
          description="Veille modèles, prix, repos, outils et régulation — digest nocturne."
          action={<Badge tone="warning">Pro</Badge>}
        />
        <Card>
          <Atmosphere variant="module" />
          <Cluster gap={3} align="start">
            <IconBox icon={Bot} size="lg" />
            <Stack gap={4} className="flex-1">
              <div>
                <Heading level={3}>Module Pro</Heading>
                <Text size="sm" tone="muted" className="mt-[var(--dh-space-2)]">
                  Débloque AI Intelligence pour le digest quotidien, les
                  sauvegardes et les filtres par pilier.
                </Text>
              </div>
              <LinkButton href="/app/settings/billing">
                <Lock className="h-4 w-4" />
                Débloquer avec Pro
              </LinkButton>
            </Stack>
          </Cluster>
        </Card>
      </>
    );
  }

  const [items, lastRun] = await Promise.all([
    getAiIntelFeed(user.id, filters).catch(() => []),
    getLatestAiIntelRun().catch(() => null),
  ]);

  const categories = [...new Set(items.map((i) => i.category))].sort();
  const digestLabel = lastRun?.finished_at
    ? new Date(lastRun.finished_at).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <>
      <PageHeader
        title="AI Intelligence"
        description="Digest nocturne multi-sources — une info, une carte, même si plusieurs sites en parlent."
        action={
          <Cluster gap={2}>
            {digestLabel ? (
              <Badge tone="success">Dernier run · {digestLabel}</Badge>
            ) : (
              <Badge tone="warning">Aucun run encore</Badge>
            )}
            {lastRun?.status ? (
              <Badge
                tone={
                  lastRun.status === "success"
                    ? "success"
                    : lastRun.status === "partial"
                      ? "warning"
                      : "danger"
                }
              >
                {lastRun.status}
              </Badge>
            ) : null}
          </Cluster>
        }
      />

      <Stack gap={4}>
        <Suspense fallback={null}>
          <FeedFilters categories={categories} />
        </Suspense>

        {items.length === 0 ? (
          <Card className="p-[var(--dh-space-5)]">
            <Stack gap={2}>
              <Heading level={3}>Rien pour ces filtres</Heading>
              <Text size="sm" tone="muted">
                {lastRun
                  ? "Aucun item ne correspond. Élargis les filtres ou attends le prochain run (02:00)."
                  : "Lance un premier scrape : POST /api/cron/ai-intel avec le header Authorization: Bearer CRON_SECRET, après avoir appliqué la migration 003."}
              </Text>
            </Stack>
          </Card>
        ) : (
          <Stack gap={3}>
            {items.map((item) => (
              <FeedItemCard key={item.id} item={item} />
            ))}
          </Stack>
        )}
      </Stack>
    </>
  );
}
