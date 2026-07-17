import { redirect } from "next/navigation";
import { getHubUser } from "@/core/auth/get-user";
import { PreferencesForm } from "@/shared/ui/settings-forms";
import {
  Card,
  PageHeader,
  SettingsBackLink,
} from "@/design-system";

export const metadata = { title: "Apparence" };

export default async function AppearanceSettingsPage() {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  return (
    <>
      <SettingsBackLink />
      <PageHeader
        title="Apparence"
        description="Thème clair / sombre, langue et notifications."
      />
      <Card>
        <PreferencesForm user={user} />
      </Card>
    </>
  );
}
