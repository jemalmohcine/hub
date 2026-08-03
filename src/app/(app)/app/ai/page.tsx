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
import { resolveLocale, t } from "@/modules/ai-intel/i18n/locale";
import { headers } from "next/headers";

export const metadata = { title: "Intelligence AI" };

type PageProps = {
  searchParams: Promise<{ item?: string; key?: string }>;
};

export default async function AiModulePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  const entitled = hasEntitlement(user.entitlements, "module:ai");

  if (!entitled) {
    return (
      <>
        <PageHeader
          title="Intelligence AI"
          description="Veille AI sélectionnée pour votre activité."
          action={<Badge tone="warning">Pro</Badge>}
        />
        <Card>
          <Atmosphere variant="module" />
          <Cluster gap={3} align="start">
            <IconBox icon={Bot} size="lg" />
            <Stack gap={4} className="flex-1">
              <div>
                <Heading level={3}>Disponible avec Pro</Heading>
                <Text size="sm" tone="muted" className="mt-[var(--dh-space-2)]">
                  Accédez au fil d’actualités, aux favoris et aux alertes.
                </Text>
              </div>
              <LinkButton href="/app/settings/billing">
                <Lock className="h-4 w-4" />
                Passer à Pro
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

  const headerStore = await headers();
  const locale = resolveLocale(
    user.preferences?.locale,
    headerStore.get("accept-language"),
  );

  const digestLabel = lastRun?.finished_at
    ? new Date(lastRun.finished_at).toLocaleString(
        locale === "en" ? "en-US" : "fr-FR",
        {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        },
      )
    : null;

  const copy = t(locale);

  return (
    <>
      <PageHeader title={copy.pageTitle} description={copy.pageDesc} />
      <AiIntelWorkspace
        initialItems={items}
        digestLabel={
          digestLabel
            ? `${copy.digestPrefix} · ${digestLabel}`
            : null
        }
        initialLocale={locale}
        deepLinkItemId={params.item ?? null}
        deepLinkCanonicalKey={params.key ?? null}
      />
    </>
  );
}
