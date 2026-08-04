import { redirect } from "next/navigation";
import { Lock, PiggyBank } from "lucide-react";
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
  computeMonthlyTotals,
  listDevExpenseServices,
} from "@/modules/dev-expenses/queries";
import { DevExpensesWorkspace } from "@/modules/dev-expenses/ui/dev-expenses-workspace";

export const metadata = { title: "Dépenses dev" };

export default async function ExpensesPage() {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  const entitled = hasEntitlement(user.entitlements, "module:expenses");

  if (!entitled) {
    return (
      <>
        <PageHeader
          title="Dépenses dev"
          description="Suivi des outils et services que tu paies chaque mois."
          action={<Badge tone="warning">Pro</Badge>}
        />
        <Card>
          <Atmosphere variant="module" />
          <Cluster gap={3} align="start">
            <IconBox icon={PiggyBank} size="lg" />
            <Stack gap={4} className="flex-1">
              <div>
                <Heading level={3}>Disponible avec Pro</Heading>
                <Text size="sm" tone="muted" className="mt-[var(--dh-space-2)]">
                  Centralise Vercel, OpenAI, Supabase… Compare des alternatives moins chères
                  avec avantages et inconvénients.
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

  const services = await listDevExpenseServices(user.id).catch(() => []);
  const totals = computeMonthlyTotals(services);

  return (
    <>
      <PageHeader
        title="Dépenses dev"
        description="Services payants, budget mensuel et diagnostic d’alternatives moins chères."
      />
      <DevExpensesWorkspace initialServices={services} totals={totals} />
    </>
  );
}
