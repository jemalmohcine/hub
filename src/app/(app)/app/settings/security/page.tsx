import { redirect } from "next/navigation";
import { getHubUser, getSessionUser } from "@/core/auth/get-user";
import { hasPasswordLogin } from "@/core/auth/identities";
import { signOut } from "@/core/auth/actions";
import { ChangePasswordForm, SetPasswordForm } from "@/shared/ui/auth-forms";
import {
  Alert,
  Button,
  Card,
  Form,
  PageHeader,
  SettingsBackLink,
  SettingsMetaRow,
  SettingsSection,
  Spacer,
  Stack,
  Text,
} from "@/design-system";

export const metadata = { title: "Sécurité" };

export default async function SecuritySettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ password?: string }>;
}) {
  const user = await getHubUser();
  if (!user) redirect("/sign-in");

  const sessionUser = await getSessionUser();
  const canSignInWithPassword = hasPasswordLogin(sessionUser);
  const params = await searchParams;

  return (
    <>
      <SettingsBackLink />
      <PageHeader
        title="Sécurité"
        description="Mot de passe, session et accès à ton compte."
      />

      {params.password === "updated" ? (
        <Alert tone="success" className="mb-4">
          Mot de passe mis à jour.
        </Alert>
      ) : null}

      <Card>
        <SettingsSection title="Compte connecté">
          <div className="-mt-1">
            <SettingsMetaRow label="Email" value={user.email} />
            <SettingsMetaRow
              label="Rôle"
              value={<span className="capitalize">{user.profile.role}</span>}
            />
          </div>
        </SettingsSection>
      </Card>

      <Spacer size={4} />

      <Card>
        <Stack gap={4}>
          {canSignInWithPassword ? (
            <>
              <div>
                <Text weight="medium">Changer le mot de passe</Text>
                <Text size="sm" tone="muted" className="mt-1">
                  Tu peux aussi continuer à te connecter avec Google ou GitHub.
                </Text>
              </div>
              <ChangePasswordForm />
            </>
          ) : (
            <>
              <div>
                <Text weight="medium">Ajouter un mot de passe</Text>
                <Text size="sm" tone="muted" className="mt-1">
                  Ton compte a été créé avec Google ou GitHub. Ajoute un mot de
                  passe pour te connecter aussi avec le même email.
                </Text>
              </div>
              <SetPasswordForm />
            </>
          )}
        </Stack>
      </Card>

      <Spacer size={4} />

      <Card>
        <Stack gap={4}>
          <div>
            <Text weight="medium">Session</Text>
            <Text size="sm" tone="muted" className="mt-1">
              Déconnecte-toi de cet appareil.
            </Text>
          </div>
          <Form action={signOut}>
            <Button type="submit" variant="danger">
              Se déconnecter
            </Button>
          </Form>
        </Stack>
      </Card>
    </>
  );
}
