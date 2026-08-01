import { redirect } from "next/navigation";
import { FileText, Lock } from "lucide-react";
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
import { defaultCvDocument } from "@/modules/cv-builder/defaults";
import { getCvDocument } from "@/modules/cv-builder/queries";
import { CvBuilderWorkspace } from "@/modules/cv-builder/ui/cv-builder-workspace";

export const metadata = { title: "CV Builder" };

export default async function CvBuilderPage() {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  const entitled = hasEntitlement(user.entitlements, "module:cv");

  if (!entitled) {
    return (
      <>
        <PageHeader
          title="CV Builder"
          description="Crée et exporte ton CV développeur en quelques minutes."
          action={<Badge tone="warning">Pro</Badge>}
        />
        <Card>
          <Atmosphere variant="module" />
          <Cluster gap={3} align="start">
            <IconBox icon={FileText} size="lg" />
            <Stack gap={4} className="flex-1">
              <div>
                <Heading level={3}>Disponible avec Pro</Heading>
                <Text size="sm" tone="muted" className="mt-[var(--dh-space-2)]">
                  4 thèmes, sections dédiées au profil dev, export PDF / Markdown.
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

  const saved = await getCvDocument(user.id).catch(() => null);
  const initialDoc = saved ?? defaultCvDocument();

  return (
    <>
      <PageHeader
        title="CV Builder"
        description="CV développeur : profil, stack, projets, open source. 4 thèmes, export PDF."
      />
      <CvBuilderWorkspace initialDoc={initialDoc} />
    </>
  );
}
