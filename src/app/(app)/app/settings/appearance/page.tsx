import { redirect } from "next/navigation";
import { getHubUser } from "@/core/auth/get-user";
import { PreferencesForm } from "@/shared/ui/settings-forms";
import {
  Card,
  PageHeader,
  SettingsBackLink,
} from "@/design-system";

export const metadata = { title: "Langue & apparence" };

export default async function AppearanceSettingsPage() {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  return (
    <>
      <SettingsBackLink />
      <PageHeader
        title="Langue & apparence"
        description="Langue (auto / FR / EN), thème et notifications."
      />
      <Card>
        <PreferencesForm user={user} />
      </Card>
    </>
  );
}
