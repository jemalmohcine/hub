import { PiggyBank, Wrench } from "lucide-react";
import { requirePageUser } from "@/core/auth/get-user";
import { Stack } from "@/design-system";
import {
  computeMonthlyTotals,
  listDevExpenseServices,
} from "@/modules/dev-expenses/queries";
import { DevExpensesWorkspace } from "@/modules/dev-expenses/ui/dev-expenses-workspace";
import { getCatalogFreshness, listDevTools } from "@/modules/dev-tools/queries";
import { ToolsDirectory } from "@/modules/dev-tools/ui/tools-directory";
import { ModulePage, isModulePageUnlocked } from "@/shared/ui/module-page";
import { TabNav } from "@/shared/ui/tab-nav";
import { slugify } from "@/lib/slug";

export const metadata = { title: "Dépenses dev" };

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

const TABS = [
  { id: "expenses", label: "Mes dépenses", href: "/app/expenses", icon: PiggyBank },
  { id: "tools", label: "Catalogue d’outils", href: "/app/expenses?tab=tools", icon: Wrench },
];

export default async function ExpensesPage({ searchParams }: PageProps) {
  const user = await requirePageUser();

  if (!isModulePageUnlocked(user, "expenses")) {
    return <ModulePage module="expenses" user={user} />;
  }

  const params = await searchParams;
  const tab = params.tab === "tools" ? "tools" : "expenses";
  const services = await listDevExpenseServices(user.id).catch(() => []);

  return (
    <ModulePage module="expenses" user={user}>
      <Stack gap={4}>
        <TabNav items={TABS} active={tab} label="Sections des dépenses" />
        {tab === "tools" ? (
          <ToolsTab ownedSlugs={ownedSlugsFrom(services)} />
        ) : (
          <DevExpensesWorkspace
            initialServices={services}
            totals={computeMonthlyTotals(services)}
          />
        )}
      </Stack>
    </ModulePage>
  );
}

async function ToolsTab({ ownedSlugs }: { ownedSlugs: string[] }) {
  const [tools, freshness] = await Promise.all([
    listDevTools().catch(() => []),
    getCatalogFreshness().catch(() => null),
  ]);

  return <ToolsDirectory tools={tools} ownedSlugs={ownedSlugs} freshness={freshness} />;
}

/** Match the catalogue against what the user pays for, by slug or by name. */
function ownedSlugsFrom(services: { name: string; providerSlug: string | null }[]): string[] {
  const slugs = new Set<string>();
  for (const service of services) {
    if (service.providerSlug) slugs.add(service.providerSlug.toLowerCase());
    slugs.add(slugify(service.name));
  }
  return [...slugs];
}
