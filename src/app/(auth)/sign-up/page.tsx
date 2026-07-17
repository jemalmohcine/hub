import { SignUpForm } from "@/shared/ui/auth-forms";
import { AuthShell, Card } from "@/design-system";

export const metadata = { title: "Créer un compte" };

export default function SignUpPage() {
  return (
    <AuthShell
      title="Créer un compte"
      description="Rejoins DevHub en quelques secondes"
    >
      <Card>
        <SignUpForm />
      </Card>
    </AuthShell>
  );
}
