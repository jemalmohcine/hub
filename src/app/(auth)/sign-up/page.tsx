import { SignUpForm } from "@/shared/ui/auth-forms";
import Link from "next/link";
import { Card } from "@/shared/ui";

export const metadata = { title: "Créer un compte" };

export default function SignUpPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white dark:text-[#0c1222]">
              H
            </div>
            <span className="text-lg font-semibold">DevHub</span>
          </Link>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            Créer un compte
          </h1>
          <p className="mt-1 text-sm text-muted">Rejoins DevHub en quelques secondes</p>
        </div>
        <Card>
          <SignUpForm />
        </Card>
      </div>
    </div>
  );
}
