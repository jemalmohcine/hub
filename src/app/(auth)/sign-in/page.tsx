import { SignInForm } from "@/shared/ui/auth-forms";
import { Alert, AuthShell, Card } from "@/design-system";

export const metadata = { title: "Connexion" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Connexion"
      description="Accède à ton hub développeur"
    >
      {params.error ? (
        <Alert tone="danger" className="text-center">
          Échec de l&apos;authentification. Réessaie.
        </Alert>
      ) : null}
      <Card>
        <SignInForm next={params.next} />
      </Card>
    </AuthShell>
  );
}
