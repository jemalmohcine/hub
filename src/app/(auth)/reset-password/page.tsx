import { ResetPasswordForm } from "@/shared/ui/auth-forms";
import { AuthShell, Card } from "@/design-system";

export const metadata = { title: "Nouveau mot de passe" };

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Nouveau mot de passe"
      description="Choisis un nouveau mot de passe pour ton compte."
    >
      <Card>
        <ResetPasswordForm />
      </Card>
    </AuthShell>
  );
}
