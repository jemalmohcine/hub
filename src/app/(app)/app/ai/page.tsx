import { redirect } from "next/navigation";
import { Bot, Lock } from "lucide-react";
import { getHubUser } from "@/core/auth/get-user";
import { hasEntitlement } from "@/core/entitlements";
import {
  Atmosphere,
  Badge,
  BulletList,
  Card,
  Cluster,
  Heading,
  IconBox,
  LinkButton,
  PageHeader,
  Stack,
  Text,
} from "@/design-system";

export const metadata = { title: "AI" };

export default async function AiModulePage() {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  const entitled = hasEntitlement(user.entitlements, "module:ai");

  return (
    <>
      <PageHeader
        title="AI Intelligence"
        description="Veille modèles, prix, capacity, repos et guides d'implémentation."
        action={<Badge tone="warning">Phase 2 · Coming soon</Badge>}
      />

      <Card>
        <Atmosphere variant="module" />
        <Cluster gap={3} align="start">
          <IconBox icon={Bot} size="lg" />
          <Stack gap={4} className="flex-1">
            <div>
              <Heading level={3}>Module en préparation</Heading>
              <Text size="sm" tone="muted" className="mt-[var(--dh-space-2)]">
                Le hub est prêt. Le module AI sera branché en phase 2 avec feed
                unifié, changements de prix / context window, repos tendance et
                résumés d&apos;implémentation.
              </Text>
            </div>

            <BulletList
              items={[
                "Nouveaux modèles & dépréciations",
                "Changements de pricing et de capacité tokens",
                "Repos GitHub tendance + how-to",
                "Filtres, watchlist et alertes",
              ]}
            />

            <Cluster gap={2}>
              {!entitled ? (
                <LinkButton href="/app/settings/billing">
                  <Lock className="h-4 w-4" />
                  Débloquer avec Pro
                </LinkButton>
              ) : (
                <Badge tone="success">Entitlement Pro actif</Badge>
              )}
              <LinkButton href="/app/settings/modules" variant="secondary">
                Voir mes modules
              </LinkButton>
            </Cluster>
          </Stack>
        </Cluster>
      </Card>
    </>
  );
}
