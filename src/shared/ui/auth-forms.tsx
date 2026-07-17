"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  signInWithPassword,
  signUpWithPassword,
  type ActionResult,
} from "@/core/auth/actions";
import { Button, Input, Label } from "@/shared/ui";
import { createClient } from "@/core/auth/supabase/client";

function AuthError({ state }: { state: ActionResult | null }) {
  if (!state || state.ok) return null;
  return (
    <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
      {state.error}
    </p>
  );
}

async function oauth(provider: "github" | "google") {
  const supabase = createClient();
  await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signInWithPassword, null);

  return (
    <div className="space-y-4">
      <AuthError state={state} />
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next || "/app/overview"} />
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Connexion…" : "Se connecter"}
        </Button>
      </form>

      <div className="relative py-2 text-center text-xs text-muted">
        <span className="bg-surface px-2 relative z-10">ou</span>
        <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="secondary" onClick={() => oauth("github")}>
          GitHub
        </Button>
        <Button type="button" variant="secondary" onClick={() => oauth("google")}>
          Google
        </Button>
      </div>

      <p className="text-center text-sm text-muted">
        Pas de compte ?{" "}
        <Link href="/sign-up" className="font-medium text-accent">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpWithPassword, null);

  return (
    <div className="space-y-4">
      <AuthError state={state} />
      <form action={action} className="space-y-4">
        <div>
          <Label htmlFor="display_name">Nom</Label>
          <Input id="display_name" name="display_name" autoComplete="name" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Création…" : "Créer mon compte"}
        </Button>
      </form>

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="secondary" onClick={() => oauth("github")}>
          GitHub
        </Button>
        <Button type="button" variant="secondary" onClick={() => oauth("google")}>
          Google
        </Button>
      </div>

      <p className="text-center text-sm text-muted">
        Déjà un compte ?{" "}
        <Link href="/sign-in" className="font-medium text-accent">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
