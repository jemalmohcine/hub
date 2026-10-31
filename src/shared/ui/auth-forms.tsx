"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  changePassword,
  requestPasswordOtp,
  resetPassword,
  requestPasswordReset,
  setPassword,
  signInWithPassword,
  signUpWithPassword,
  type ActionResult,
} from "@/core/auth/actions";
import { createClient } from "@/core/auth/supabase/client";
import {
  Alert,
  Button,
  Divider,
  Field,
  Form,
  Grid,
  InlineLink,
  Input,
  PasswordInput,
  Stack,
  Text,
  useActionToast,
} from "@/design-system";
import {
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  validateSetPassword,
  validateSignIn,
  validateSignUp,
  type FieldErrors,
} from "@/design-system/lib/validation";

function AuthAlert({ state }: { state: ActionResult | null }) {
  if (!state || state.ok) return null;
  return <Alert tone="danger">{state.error}</Alert>;
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

function clearField(
  setErrors: React.Dispatch<React.SetStateAction<FieldErrors>>,
  key: string,
) {
  setErrors((prev) => {
    if (!prev[key]) return prev;
    const next = { ...prev };
    delete next[key];
    return next;
  });
}

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signInWithPassword, null);
  useActionToast(state, { error: "Connexion impossible" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();

  const busy = pending || isPending;

  return (
    <Stack gap={4}>
      <AuthAlert state={state} />
      <Form
        action={(formData) => {
          const result = validateSignIn(formData);
          if (!result.ok) {
            setErrors(result.fields);
            return;
          }
          setErrors({});
          startTransition(() => action(formData));
        }}
      >
        <Stack gap={4}>
          <input type="hidden" name="next" value={next || "/app/overview"} />
          <Field label="Email" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              onChange={() => clearField(setErrors, "email")}
            />
          </Field>
          <Field label="Mot de passe" htmlFor="password" error={errors.password}>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              onChange={() => clearField(setErrors, "password")}
            />
          </Field>
          <div className="-mt-1 flex justify-end">
            <InlineLink href="/forgot-password">Mot de passe oublié ?</InlineLink>
          </div>
          <Button type="submit" fullWidth disabled={busy}>
            {busy ? "Connexion…" : "Se connecter"}
          </Button>
        </Stack>
      </Form>

      <Divider label="ou" />

      <div className="grid grid-cols-2 gap-[var(--dh-space-2)]">
        <Button
          type="button"
          variant="secondary"
          onClick={() => oauth("github")}
        >
          GitHub
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => oauth("google")}
        >
          Google
        </Button>
      </div>

      <Text size="sm" tone="muted" className="text-center">
        Pas de compte ? <InlineLink href="/sign-up">Créer un compte</InlineLink>
      </Text>
    </Stack>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpWithPassword, null);
  useActionToast(state, { error: "Création de compte impossible" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();

  const busy = pending || isPending;

  return (
    <Stack gap={4}>
      <AuthAlert state={state} />
      <Form
        action={(formData) => {
          const result = validateSignUp(formData);
          if (!result.ok) {
            setErrors(result.fields);
            return;
          }
          setErrors({});
          startTransition(() => action(formData));
        }}
      >
        <Stack gap={4}>
          <Grid cols={2} gap={3}>
            <Field label="Prénom" htmlFor="first_name">
              <Input
                id="first_name"
                name="first_name"
                autoComplete="given-name"
              />
            </Field>
            <Field label="Nom" htmlFor="last_name">
              <Input
                id="last_name"
                name="last_name"
                autoComplete="family-name"
              />
            </Field>
          </Grid>
          <Field label="Email" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              onChange={() => clearField(setErrors, "email")}
            />
          </Field>
          <Field
            label="Mot de passe"
            htmlFor="password"
            error={errors.password}
            hint="Au moins 8 caractères"
          >
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              onChange={() => clearField(setErrors, "password")}
            />
          </Field>
          <Button type="submit" fullWidth disabled={busy}>
            {busy ? "Création…" : "Créer mon compte"}
          </Button>
        </Stack>
      </Form>

      <div className="grid grid-cols-2 gap-[var(--dh-space-2)]">
        <Button
          type="button"
          variant="secondary"
          onClick={() => oauth("github")}
        >
          GitHub
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => oauth("google")}
        >
          Google
        </Button>
      </div>

      <Text size="sm" tone="muted" className="text-center">
        Déjà un compte ? <InlineLink href="/sign-in">Se connecter</InlineLink>
      </Text>
    </Stack>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);
  useActionToast(state, {
    success: "Email envoyé si le compte existe",
    error: "Impossible d'envoyer l'email",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();
  const busy = pending || isPending;

  if (state?.ok) {
    return (
      <Stack gap={4}>
        <Alert tone="success">
          Si un compte existe pour cet email, tu recevras un lien pour
          réinitialiser ton mot de passe.
        </Alert>
        <Text size="sm" tone="muted" className="text-center">
          <InlineLink href="/sign-in">Retour à la connexion</InlineLink>
        </Text>
      </Stack>
    );
  }

  return (
    <Stack gap={4}>
      <AuthAlert state={state} />
      <Form
        action={(formData) => {
          const result = validateForgotPassword(formData);
          if (!result.ok) {
            setErrors(result.fields);
            return;
          }
          setErrors({});
          startTransition(() => action(formData));
        }}
      >
        <Stack gap={4}>
          <Field label="Email" htmlFor="email" error={errors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              onChange={() => clearField(setErrors, "email")}
            />
          </Field>
          <Button type="submit" fullWidth disabled={busy}>
            {busy ? "Envoi…" : "Envoyer le lien"}
          </Button>
        </Stack>
      </Form>
      <Text size="sm" tone="muted" className="text-center">
        <InlineLink href="/sign-in">Retour à la connexion</InlineLink>
      </Text>
    </Stack>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, null);
  useActionToast(state, {
    success: "Mot de passe mis à jour",
    error: "Impossible de réinitialiser le mot de passe",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();
  const busy = pending || isPending;

  return (
    <Stack gap={4}>
      <AuthAlert state={state} />
      <Form
        action={(formData) => {
          const result = validateResetPassword(formData);
          if (!result.ok) {
            setErrors(result.fields);
            return;
          }
          setErrors({});
          startTransition(() => action(formData));
        }}
      >
        <Stack gap={4}>
          <Field
            label="Nouveau mot de passe"
            htmlFor="password"
            error={errors.password}
            hint="Au moins 8 caractères"
          >
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              onChange={() => clearField(setErrors, "password")}
            />
          </Field>
          <Field
            label="Confirmer"
            htmlFor="confirm_password"
            error={errors.confirm_password}
          >
            <PasswordInput
              id="confirm_password"
              name="confirm_password"
              autoComplete="new-password"
              onChange={() => clearField(setErrors, "confirm_password")}
            />
          </Field>
          <Button type="submit" fullWidth disabled={busy}>
            {busy ? "Mise à jour…" : "Enregistrer le mot de passe"}
          </Button>
        </Stack>
      </Form>
    </Stack>
  );
}

export function SetPasswordForm({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [sendState, sendAction, sendPending] = useActionState(
    requestPasswordOtp,
    null,
  );
  const [state, action, pending] = useActionState(setPassword, null);
  useActionToast(sendState, {
    success: "Code envoyé",
    error: "Impossible d’envoyer le code",
  });
  useActionToast(state, {
    success: "Mot de passe ajouté",
    error: "Impossible d’ajouter le mot de passe",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();
  const busy = pending || isPending || sendPending;

  useEffect(() => {
    if (sendState?.ok) setSent(true);
  }, [sendState]);

  if (state?.ok) {
    return (
      <Alert tone="success">
        Mot de passe ajouté. Tu peux maintenant te connecter avec Google ou
        avec email + mot de passe.
      </Alert>
    );
  }

  if (!sent) {
    return (
      <Form
        action={(formData) => {
          startTransition(() => sendAction(formData));
        }}
      >
        <Stack gap={4}>
          <AuthAlert state={sendState} />
          <div className="pt-1">
            <Button type="submit" disabled={sendPending}>
              {sendPending ? "Envoi…" : "Envoyer le code"}
            </Button>
          </div>
        </Stack>
      </Form>
    );
  }

  return (
    <Form
      action={(formData) => {
        const result = validateSetPassword(formData);
        if (!result.ok) {
          setErrors(result.fields);
          return;
        }
        setErrors({});
        startTransition(() => action(formData));
      }}
    >
      <Stack gap={4}>
          {sendState && !sendState.ok ? (
            <AuthAlert state={sendState} />
          ) : (
            <Alert tone="success">Code envoyé à {email}. Il expire vite.</Alert>
          )}
          <AuthAlert state={state} />
          <Field
            label="Code de vérification"
            htmlFor="otp"
            error={errors.otp}
            hint="Le code reçu par email"
          >
            <Input
              id="otp"
              name="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={8}
              onChange={() => clearField(setErrors, "otp")}
            />
          </Field>
          <Field
            label="Mot de passe"
            htmlFor="password"
            error={errors.password}
            hint="Au moins 8 caractères"
          >
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              onChange={() => clearField(setErrors, "password")}
            />
          </Field>
          <Field
            label="Confirmer"
            htmlFor="confirm_password"
            error={errors.confirm_password}
          >
            <PasswordInput
              id="confirm_password"
              name="confirm_password"
              autoComplete="new-password"
              onChange={() => clearField(setErrors, "confirm_password")}
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button type="submit" disabled={busy}>
              {pending || isPending ? "Enregistrement…" : "Ajouter un mot de passe"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={sendPending}
              onClick={() => {
                startTransition(() => sendAction(new FormData()));
              }}
            >
              {sendPending ? "Envoi…" : "Renvoyer le code"}
            </Button>
          </div>
        </Stack>
      </Form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, null);
  useActionToast(state, {
    success: "Mot de passe changé",
    error: "Impossible de changer le mot de passe",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();
  const busy = pending || isPending;

  return (
    <Form
      action={(formData) => {
        const result = validateChangePassword(formData);
        if (!result.ok) {
          setErrors(result.fields);
          return;
        }
        setErrors({});
        startTransition(() => action(formData));
      }}
    >
      <Stack gap={4}>
        {state?.ok ? (
          <Alert tone="success">Mot de passe mis à jour.</Alert>
        ) : null}
        <AuthAlert state={state} />
        <Field
          label="Mot de passe actuel"
          htmlFor="current_password"
          error={errors.current_password}
        >
          <PasswordInput
            id="current_password"
            name="current_password"
            autoComplete="current-password"
            onChange={() => clearField(setErrors, "current_password")}
          />
        </Field>
        <Field
          label="Nouveau mot de passe"
          htmlFor="password"
          error={errors.password}
          hint="Au moins 8 caractères"
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            onChange={() => clearField(setErrors, "password")}
          />
        </Field>
        <Field
          label="Confirmer le nouveau"
          htmlFor="confirm_password"
          error={errors.confirm_password}
        >
          <PasswordInput
            id="confirm_password"
            name="confirm_password"
            autoComplete="new-password"
            onChange={() => clearField(setErrors, "confirm_password")}
          />
        </Field>
        <div className="pt-1">
          <Button type="submit" disabled={busy}>
            {busy ? "Mise à jour…" : "Changer le mot de passe"}
          </Button>
        </div>
      </Stack>
    </Form>
  );
}
