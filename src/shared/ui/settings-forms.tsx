"use client";

import { useActionState, useState } from "react";
import { useTheme } from "next-themes";
import {
  mockUpgradePlan,
  updatePreferences,
  updateProfile,
  type ActionResult,
} from "@/core/auth/actions";
import type { HubUser, ThemePreference } from "@/core/auth/types";
import { PLAN_META } from "@/core/entitlements";
import {
  Alert,
  Button,
  Checkbox,
  Field,
  Form,
  Grid,
  Input,
  PlanCard,
  Select,
  Stack,
  Text,
  useActionToast,
} from "@/design-system";

function ResultAlert({ state }: { state: ActionResult | null }) {
  if (!state || state.ok) return null;
  return <Alert tone="danger">{state.error}</Alert>;
}

export function ProfileForm({ user }: { user: HubUser }) {
  const [state, action, pending] = useActionState(updateProfile, null);
  useActionToast(state, { success: "Profil mis à jour" });

  return (
    <Form action={action}>
      <Stack gap={4}>
        <ResultAlert state={state} />
        <Grid cols={2} gap={3}>
          <Field label="Prénom" htmlFor="first_name">
            <Input
              id="first_name"
              name="first_name"
              defaultValue={user.profile.first_name ?? ""}
              placeholder="Prénom"
              autoComplete="given-name"
            />
          </Field>
          <Field label="Nom" htmlFor="last_name">
            <Input
              id="last_name"
              name="last_name"
              defaultValue={user.profile.last_name ?? ""}
              placeholder="Nom"
              autoComplete="family-name"
            />
          </Field>
        </Grid>
        <Field
          label="Email"
          htmlFor="email"
          hint="Géré par l’authentification (lecture seule)."
        >
          <Input id="email" value={user.email} disabled />
        </Field>
        <div className="pt-1">
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      </Stack>
    </Form>
  );
}

export function PreferencesForm({ user }: { user: HubUser }) {
  const [state, action, pending] = useActionState(updatePreferences, null);
  useActionToast(state, { success: "Préférences enregistrées" });
  const prefs = user.preferences;
  const { setTheme } = useTheme();
  const initialLocale = (() => {
    const raw = (prefs?.locale ?? "auto").toLowerCase();
    if (raw === "auto") return "auto";
    if (raw.startsWith("en")) return "en";
    if (raw.startsWith("fr")) return "fr";
    return "auto";
  })();
  const [locale, setLocale] = useState<"auto" | "fr" | "en">(initialLocale);

  return (
    <Form action={action}>
      <Stack gap={5}>
        <ResultAlert state={state} />

        <Stack gap={3}>
          <div>
            <Text weight="medium" size="sm">
              Langue
            </Text>
            <Text size="sm" tone="muted" className="mt-1">
              Suit la langue du navigateur, ou forcez le français / l’anglais.
            </Text>
          </div>
          <input type="hidden" name="locale" value={locale} />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(
              [
                {
                  id: "auto" as const,
                  label: "Automatique",
                  hint: "Navigateur",
                },
                { id: "fr" as const, label: "Français", hint: "FR" },
                { id: "en" as const, label: "English", hint: "EN" },
              ] as const
            ).map((opt) => {
              const active = locale === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLocale(opt.id)}
                  className={
                    active
                      ? "rounded-2xl border border-[var(--dh-brand)] bg-[var(--dh-brand-soft)]/40 px-4 py-3.5 text-left"
                      : "rounded-2xl border border-border bg-muted/30 px-4 py-3.5 text-left"
                  }
                >
                  <Text weight="medium">{opt.label}</Text>
                  <Text size="sm" tone="muted" className="mt-0.5">
                    {opt.hint}
                  </Text>
                </button>
              );
            })}
          </div>
        </Stack>

        <div className="h-px bg-border" aria-hidden />

        <Stack gap={4}>
          <Text weight="medium" size="sm">
            Affichage
          </Text>
          <Field label="Thème" htmlFor="theme">
            <Select
              id="theme"
              name="theme"
              defaultValue={prefs?.theme ?? "system"}
              onChange={(e) => {
                setTheme(e.target.value as ThemePreference);
              }}
            >
              <option value="system">Système</option>
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
            </Select>
          </Field>
        </Stack>

        <div className="h-px bg-border" aria-hidden />

        <Stack gap={3}>
          <Text weight="medium" size="sm">
            Notifications
          </Text>
          <Checkbox
            name="email_notifications"
            label="Notifications email"
            defaultChecked={prefs?.email_notifications ?? true}
          />
          <Checkbox
            name="product_updates"
            label="Product updates"
            defaultChecked={prefs?.product_updates ?? true}
          />
        </Stack>

        <div className="pt-1">
          <Button type="submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer les préférences"}
          </Button>
        </div>
      </Stack>
    </Form>
  );
}

export function BillingForm({ user }: { user: HubUser }) {
  const [state, action, pending] = useActionState(mockUpgradePlan, null);
  useActionToast(state, { success: "Plan mis à jour" });
  const plan = user.subscription?.plan ?? "free";

  return (
    <Stack gap={4}>
      <ResultAlert state={state} />
      <Grid cols={2} gap={3}>
        {(["free", "pro"] as const).map((id) => {
          const meta = PLAN_META[id];
          const active = plan === id;
          return (
            <PlanCard
              key={id}
              title={meta.label}
              price={meta.priceLabel}
              description={meta.description}
              active={active}
              action={
                <Form action={action}>
                  <input type="hidden" name="plan" value={id} />
                  <Button type="submit" variant="secondary" disabled={pending}>
                    {pending
                      ? "…"
                      : id === "pro"
                        ? "Passer Pro"
                        : "Repasser Free"}
                  </Button>
                </Form>
              }
            />
          );
        })}
      </Grid>
    </Stack>
  );
}
