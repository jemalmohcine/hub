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
} from "@/modules/ai-intel/queries";
import { AiIntelWorkspace } from "@/modules/ai-intel/ui/ai-intel-workspace";

export const metadata = { title: "AI" };

export default async function AiModulePage() {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  const entitled = hasEntitlement(user.entitlements, "module:ai");

  if (!entitled) {
    return (
      <>
        <PageHeader
          title="AI Intelligence"
          description="Toute la veille AI pour rester à jour."
          action={<Badge tone="warning">Pro</Badge>}
        />
        <Card>
          <Atmosphere variant="module" />
          <Cluster gap={3} align="start">
            <IconBox icon={Bot} size="lg" />
            <Stack gap={4} className="flex-1">
              <div>
                <Heading level={3}>Réservé aux comptes Pro</Heading>
                <Text size="sm" tone="muted" className="mt-[var(--dh-space-2)]">
                  Passe en Pro pour accéder au feed, aux sauvegardes et aux
                  alertes.
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
    getAiIntelFeed(user.id, {}).catch(() => []),
    getLatestAiIntelRun().catch(() => null),
  ]);

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
        description="Modèles, outils, open source et actualité. Clique une carte pour le détail."
      />
      <AiIntelWorkspace
        initialItems={items}
        digestLabel={digestLabel}
      />
    </>
  );
}
