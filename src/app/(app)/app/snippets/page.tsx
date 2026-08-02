import { redirect } from "next/navigation";
import { Code2, Lock } from "lucide-react";
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
import { listDevSnippets } from "@/modules/dev-snippets/queries";
import { SnippetsWorkspace } from "@/modules/dev-snippets/ui/snippets-workspace";

export const metadata = { title: "Dev Snippets" };

export default async function SnippetsPage() {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  const entitled = hasEntitlement(user.entitlements, "module:snippets");

  if (!entitled) {
    return (
      <>
        <PageHeader
          title="Dev Snippets / Notes"
          description="Bibliothèque personnelle de snippets et notes, avec recherche web intégrée."
          action={<Badge tone="warning">Pro</Badge>}
        />
        <Card>
          <Atmosphere variant="module" />
          <Cluster gap={3} align="start">
            <IconBox icon={Code2} size="lg" />
            <Stack gap={4} className="flex-1">
              <div>
                <Heading level={3}>Disponible avec Pro</Heading>
                <Text size="sm" tone="muted" className="mt-[var(--dh-space-2)]">
                  Sauvegardez vos extraits de code, notes techniques et lancez une
                  recherche MDN, Stack Overflow, DevDocs, npm ou GitHub en un clic.
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

  const snippets = await listDevSnippets(user.id).catch(() => []);

  return (
    <>
      <PageHeader
        title="Dev Snippets / Notes"
        description="Snippets, notes et recherche rapide vers la doc en ligne."
      />
      <SnippetsWorkspace initialSnippets={snippets} />
    </>
  );
}
