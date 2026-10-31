import { SignUpForm } from "@/shared/ui/auth-forms";
import { AuthShell, Card } from "@/design-system";
import { SITE_NAME } from "@/lib/site";

export const metadata = {
  title: "Créer un compte",
  description: `Rejoins ${SITE_NAME} : veille IA, CV, candidatures, snippets et budget outils. Inscription Google, GitHub ou email.`,
  alternates: { canonical: "/sign-up" },
};

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
