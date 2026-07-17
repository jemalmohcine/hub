import {
  Blocks,
  KeyRound,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import {
  Atmosphere,
  BrandMark,
  Cluster,
  Container,
  Eyebrow,
  Heading,
  LinkButton,
  Stack,
  Text,
  ThemeToggle,
} from "@/design-system";

const PILLARS = [
  {
    icon: LayoutDashboard,
    title: "Un shell, plusieurs modules",
    description:
      "DevHub est le cadre commun : navigation, compte, rôles et abonnement. Chaque outil (AI, etc.) s’y branche en onglet, sans réinventer l’auth ni les settings.",
  },
  {
    icon: KeyRound,
    title: "Auth & accès prêts",
    description:
      "Connexion email, OAuth, rôles user/admin et entitlements par plan. Tu ouvres un module seulement si ton compte y a droit.",
  },
  {
    icon: WalletCards,
    title: "Billing abstrait",
    description:
      "Free / Pro côté produit, sans coller Stripe dans le code. Branche le PSP que tu veux plus tard — le hub reste le même.",
  },
] as const;

const STEPS = [
  {
    step: "01",
    title: "Tu te connectes",
    text: "Compte sécurisé, profil, thème et préférences dans Settings.",
  },
  {
    step: "02",
    title: "Tu ouvres le hub",
    text: "Overview, modules actifs, et placeholders pour ce qui arrive.",
  },
  {
    step: "03",
    title: "Tu actives des modules",
    text: "Chaque module vit dans le même shell — PWA mobile-first incluse.",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <Atmosphere variant="landing" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklch, var(--border) 70%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklch, var(--border) 70%, transparent) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 70% 55% at 50% 0%, black 20%, transparent 75%)",
        }}
        aria-hidden
      />

      <header className="relative z-10 py-5">
        <Container size="content">
          <Cluster className="justify-between">
            <BrandMark withWordmark />
            <Cluster gap={2}>
              <ThemeToggle />
              <LinkButton href="/sign-in" variant="ghost" className="hidden sm:inline-flex">
                Connexion
              </LinkButton>
              <LinkButton href="/sign-up">Commencer</LinkButton>
            </Cluster>
          </Cluster>
        </Container>
      </header>

      <main className="relative z-10">
        {/* Hero — one composition */}
        <section className="flex min-h-[calc(100dvh-5.5rem)] flex-col justify-center pb-16 pt-8 sm:pt-12">
          <Container size="content">
            <Stack gap={5} className="max-w-3xl animate-landing-rise">
              <Eyebrow>Developer Hub</Eyebrow>
              <Heading
                level={1}
                className="!text-[clamp(2.75rem,8vw,4.75rem)] !leading-[0.95] !tracking-[-0.04em]"
              >
                DevHub
              </Heading>
              <Text
                size="lg"
                tone="muted"
                className="max-w-xl !text-base sm:!text-lg"
              >
                Le hub développeur qui regroupe auth, modules et settings en un
                seul endroit — prêt pour brancher tes outils (AI en phase 2).
              </Text>
              <Cluster gap={3} className="pt-1">
                <LinkButton href="/sign-up" className="min-w-[10rem]">
                  Créer un compte
                </LinkButton>
                <LinkButton
                  href="/sign-in"
                  variant="secondary"
                  className="min-w-[10rem]"
                >
                  Se connecter
                </LinkButton>
              </Cluster>
            </Stack>
          </Container>
        </section>

        {/* What it is */}
        <section className="border-t border-border/80 py-20 sm:py-24">
          <Container size="content">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
              <Stack gap={3} className="animate-landing-rise [animation-delay:80ms]">
                <Eyebrow>C’est quoi</Eyebrow>
                <Heading level={2} className="!text-3xl sm:!text-4xl">
                  Pas un outil de plus — une base commune.
                </Heading>
              </Stack>
              <Stack gap={4} className="animate-landing-rise [animation-delay:160ms]">
                <Text size="lg" tone="muted" className="!text-base sm:!text-lg">
                  DevHub est le socle d’une suite de modules développeur. Au lieu
                  de reconstruire connexion, rôles, abonnements et navigation
                  pour chaque produit, tu as un hub unique où chaque module
                  s’installe comme un onglet.
                </Text>
                <Text tone="muted">
                  Aujourd’hui : shell authentifié, Overview, Settings, plans Free
                  / Pro et placeholder AI. Demain : des modules métier qui
                  réutilisent exactement cette base.
                </Text>
              </Stack>
            </div>
          </Container>
        </section>

        {/* Pillars */}
        <section className="border-t border-border/80 py-20 sm:py-24">
          <Container size="content">
            <Stack gap={3} className="mb-12 max-w-2xl">
              <Eyebrow>Ce que tu obtiens</Eyebrow>
              <Heading level={2} className="!text-3xl sm:!text-4xl">
                Tout ce qu’un produit SaaS doit avoir avant le produit.
              </Heading>
            </Stack>
            <div className="grid gap-10 sm:grid-cols-3">
              {PILLARS.map((item, index) => (
                <article
                  key={item.title}
                  className="animate-landing-rise border-t border-border pt-6"
                  style={{ animationDelay: `${120 + index * 80}ms` }}
                >
                  <item.icon
                    className="mb-4 size-5 text-primary"
                    aria-hidden
                  />
                  <Heading level={3} className="!text-lg">
                    {item.title}
                  </Heading>
                  <Text size="sm" tone="muted" className="mt-2">
                    {item.description}
                  </Text>
                </article>
              ))}
            </div>
          </Container>
        </section>

        {/* How it works */}
        <section className="border-t border-border/80 py-20 sm:py-24">
          <Container size="content">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-20">
              <Stack gap={3}>
                <Eyebrow>Comment ça marche</Eyebrow>
                <Heading level={2} className="!text-3xl sm:!text-4xl">
                  Trois étapes. Un hub.
                </Heading>
                <Text tone="muted">
                  Mobile-first, installable en PWA — le même shell sur téléphone
                  et desktop.
                </Text>
              </Stack>
              <ol className="space-y-0">
                {STEPS.map((item, index) => (
                  <li
                    key={item.step}
                    className="grid grid-cols-[auto_1fr] gap-4 border-t border-border py-6 last:border-b animate-landing-rise"
                    style={{ animationDelay: `${100 + index * 90}ms` }}
                  >
                    <span className="font-mono text-sm text-primary">
                      {item.step}
                    </span>
                    <div>
                      <Text weight="medium">{item.title}</Text>
                      <Text size="sm" tone="muted" className="mt-1">
                        {item.text}
                      </Text>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </Container>
        </section>

        {/* Modules strip */}
        <section className="border-t border-border/80 py-20 sm:py-24">
          <Container size="content">
            <Stack gap={3} className="mb-10 max-w-2xl">
              <Eyebrow>Modules</Eyebrow>
              <Heading level={2} className="!text-3xl sm:!text-4xl">
                Un registre vivant — Overview aujourd’hui, AI demain.
              </Heading>
            </Stack>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-sm animate-landing-rise">
                <Cluster gap={3} className="mb-3">
                  <Blocks className="size-5 text-primary" aria-hidden />
                  <Text weight="medium">Overview</Text>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Actif
                  </span>
                </Cluster>
                <Text size="sm" tone="muted">
                  Tableau de bord du hub : plan, rôle, entitlements et accès
                  rapide aux modules.
                </Text>
              </div>
              <div
                className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 animate-landing-rise"
                style={{ animationDelay: "100ms" }}
              >
                <Cluster gap={3} className="mb-3">
                  <Sparkles className="size-5 text-muted-foreground" aria-hidden />
                  <Text weight="medium">AI</Text>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    Phase 2
                  </span>
                </Cluster>
                <Text size="sm" tone="muted">
                  Module AI branché sur le même shell, gated par le plan Pro —
                  placeholder prêt, produit à venir.
                </Text>
              </div>
            </div>
            <Cluster gap={2} className="mt-8 text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0" aria-hidden />
              <Text size="sm" tone="muted">
                Accès contrôlé par rôles et entitlements — admin pour le
                pilotage global des flags modules.
              </Text>
            </Cluster>
          </Container>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border/80 py-20 sm:py-28">
          <Container size="content">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-gradient-to-br from-primary/15 via-background to-background px-6 py-14 sm:px-12 sm:py-16">
              <div
                className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/20 blur-3xl"
                aria-hidden
              />
              <Stack gap={4} className="relative max-w-xl animate-landing-rise">
                <Heading level={2} className="!text-3xl sm:!text-4xl">
                  Entre dans le hub.
                </Heading>
                <Text tone="muted">
                  Crée un compte, explore Overview, et configure Settings. Les
                  modules suivants se brancheront dessus.
                </Text>
                <Cluster gap={3} className="pt-2">
                  <LinkButton href="/sign-up">Créer un compte</LinkButton>
                  <LinkButton href="/sign-in" variant="secondary">
                    J’ai déjà un compte
                  </LinkButton>
                </Cluster>
              </Stack>
            </div>
          </Container>
        </section>
      </main>

      <footer className="relative z-10 border-t border-border/80 py-8">
        <Container size="content">
          <Cluster className="justify-between text-sm text-muted-foreground">
            <Text size="sm" tone="muted">
              © {new Date().getFullYear()} DevHub
            </Text>
            <Cluster gap={4}>
              <LinkButton href="/sign-in" variant="ghost" size="sm">
                Connexion
              </LinkButton>
              <LinkButton href="/sign-up" variant="ghost" size="sm">
                Inscription
              </LinkButton>
            </Cluster>
          </Cluster>
        </Container>
      </footer>
    </div>
  );
}
