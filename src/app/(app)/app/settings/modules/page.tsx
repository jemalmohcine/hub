import { redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { getHubUser } from "@/core/auth/get-user";
import { getSortedModules } from "@/core/module-registry";
import { hasEntitlement } from "@/core/entitlements";
import {
  Badge,
  Card,
  Cluster,
  Heading,
  IconBox,
  LinkButton,
  PageHeader,
  SettingsBackLink,
  SettingsSection,
  Stack,
  Text,
} from "@/design-system";

export const metadata = { title: "Modules" };

export default async function ModulesSettingsPage() {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  const modules = getSortedModules();
  const unlocked = modules.filter((m) =>
    hasEntitlement(user.entitlements, m.requiredEntitlement),
  ).length;

  return (
    <>
      <SettingsBackLink />
      <PageHeader
        title="Modules"
        description={`${unlocked} / ${modules.length} accessibles avec ton plan.`}
      />

      <SettingsSection>
        <Stack gap={3}>
          {modules.map((mod) => {
            const entitled = hasEntitlement(
              user.entitlements,
              mod.requiredEntitlement,
            );
            const locked = Boolean(mod.requiredEntitlement && !entitled);

            return (
              <Card key={mod.id}>
                <Cluster gap={3} align="start">
                  <IconBox icon={mod.icon} />
                  <Stack gap={2} className="min-w-0 flex-1">
                    <Cluster gap={2}>
                      <Heading level={4}>{mod.label}</Heading>
                      {mod.status === "coming_soon" ? (
                        <Badge tone="warning">Coming soon</Badge>
                      ) : (
                        <Badge tone="success">Actif</Badge>
                      )}
                      {locked ? (
                        <Badge tone="neutral">
                          <Lock className="size-3" />
                          Pro
                        </Badge>
                      ) : null}
                    </Cluster>
                    <Text size="sm" tone="muted">
                      {mod.description}
                    </Text>
                    <Cluster gap={2} className="pt-1">
                      <LinkButton href={mod.href} variant="secondary" size="sm">
                        Ouvrir
                      </LinkButton>
                      {locked ? (
                        <LinkButton
                          href="/app/settings/billing"
                          variant="ghost"
                          size="sm"
                        >
                          Débloquer
                        </LinkButton>
                      ) : null}
                    </Cluster>
                  </Stack>
                </Cluster>
              </Card>
            );
          })}
        </Stack>
      </SettingsSection>
    </>
  );
}
