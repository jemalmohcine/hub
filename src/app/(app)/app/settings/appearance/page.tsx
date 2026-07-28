import { redirect } from "next/navigation";
import { getHubUser } from "@/core/auth/get-user";
import { PreferencesForm } from "@/shared/ui/settings-forms";
import { PushEnableCard } from "@/modules/notifications/ui/push-enable";
import {
  Card,
  PageHeader,
  SettingsBackLink,
  Stack,
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
        description="Langue, thème et préférences de notification."
      />
      <Stack gap={4}>
        <PushEnableCard />
        <Card>
          <PreferencesForm user={user} />
        </Card>
      </Stack>
    </>
  );
}
