import { requirePageUser } from "@/core/auth/get-user";
import {
  computeMonthlyTotals,
  listDevExpenseServices,
} from "@/modules/dev-expenses/queries";
import { DevExpensesWorkspace } from "@/modules/dev-expenses/ui/dev-expenses-workspace";
import { ModulePage, isModulePageUnlocked } from "@/shared/ui/module-page";

export const metadata = { title: "Dépenses dev" };

export default async function ExpensesPage() {
  const user = await requirePageUser();

  if (!isModulePageUnlocked(user, "expenses")) {
    return <ModulePage module="expenses" user={user} />;
  }

  const services = await listDevExpenseServices(user.id).catch(() => []);
  const totals = computeMonthlyTotals(services);

  return (
    <ModulePage module="expenses" user={user}>
      <DevExpensesWorkspace initialServices={services} totals={totals} />
    </ModulePage>
  );
}
