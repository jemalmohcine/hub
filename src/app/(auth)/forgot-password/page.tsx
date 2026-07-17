import { ForgotPasswordForm } from "@/shared/ui/auth-forms";
import { Alert, AuthShell, Card } from "@/design-system";

export const metadata = { title: "Mot de passe oublié" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthShell
      title="Mot de passe oublié"
      description="Entre ton email — on t’envoie un lien de réinitialisation."
    >
      {params.error === "expired" ? (
        <Alert tone="danger" className="text-center">
          Lien expiré ou invalide. Demande un nouveau reset.
        </Alert>
      ) : null}
      <Card>
        <ForgotPasswordForm />
      </Card>
    </AuthShell>
  );
}
