import type { Metadata } from "next";
import { KeyRound, ShieldCheck } from "lucide-react";
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
import {
  getSortedModules,
  type ModuleId,
} from "@/core/module-registry";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
  siteOrigin,
} from "@/lib/site";

const LANDING_PITCH: Record<ModuleId, string> = {
  overview:
    "Un tableau de bord unique : ce qui a changé, tes modules, et un accès rapide à tout le hub.",
  ai: "Un fil d’actualités IA lisible : modèles, prix, dépôts et alertes quand il faut agir.",
  cv: "Crée, adapte et exporte ton CV développeur, y compris pour une offre précise.",
  jobs: "Suis tes candidatures et tes relances, sans tableur éparpillé.",
  snippets:
    "Tes bouts de code et tes notes, retrouvés par langage, tag ou intention, sans quitter le hub.",
  expenses:
    "Tes abonnements dev, le budget du mois, et des alternatives moins chères à comparer.",
};

const STEPS = [
  {
    step: "01",
    title: "Tu crées un compte",
    text: "Email et mot de passe. Confirmation par mail si ton projet l’exige.",
  },
  {
    step: "02",
    title: "Tu ouvres tes modules",
    text: "Veille IA, CV, candidatures, snippets et budget outils vivent dans le même espace, sur téléphone comme sur ordinateur.",
  },
  {
    step: "03",
    title: "Tu travailles au même endroit",
    text: "Plus besoin de dix onglets. Tes notes, ta veille et ton suivi restent dans hub.",
  },
] as const;

const FAQS = [
  {
    question: "C’est quoi hub ?",
    answer:
      "hub regroupe le quotidien d’un développeur : veille IA, CV exportable, candidatures, snippets et budget outils, dans un seul espace.",
  },
  {
    question: "Comment je me connecte ?",
    answer:
      "Avec ton email et ton mot de passe. Tu peux réinitialiser le mot de passe depuis l’écran de connexion.",
  },
  {
    question: "hub est-il gratuit ?",
    answer:
      "Oui, tu peux créer un compte gratuitement. Certains modules avancés sont réservés au plan Pro.",
  },
  {
    question: "Est-ce que ça marche sur téléphone ?",
    answer:
      "Oui. hub est pensé mobile-first et s’installe comme une application (PWA).",
  },
] as const;

export const metadata: Metadata = {
  title: {
    absolute: `${SITE_NAME} : veille IA, CV, candidatures, snippets et budget outils`,
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE_NAME} · hub développeur`,
    description: SITE_DESCRIPTION,
    url: "/",
  },
};

function landingJsonLd() {
  const origin = siteOrigin();
  const modules = getSortedModules();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": `${origin}/#app`,
        name: SITE_NAME,
        url: origin,
        description: SITE_DESCRIPTION,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web",
        inLanguage: "fr-FR",
        image: absoluteUrl("/icons/icon-512x512.png"),
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EUR",
        },
        featureList: modules.map((mod) => `${mod.label} : ${LANDING_PITCH[mod.id]}`),
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: SITE_NAME,
        url: origin,
        inLanguage: "fr-FR",
        description: SITE_DESCRIPTION,
        publisher: { "@id": `${origin}/#app` },
      },
      {
        "@type": "FAQPage",
        "@id": `${origin}/#faq`,
        inLanguage: "fr-FR",
        mainEntity: FAQS.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
}

export default function LandingPage() {
  const modules = getSortedModules();

  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(landingJsonLd()) }}
      />
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

      <header
        className="relative z-10 py-5"
        style={{ paddingTop: "calc(1.25rem + var(--dh-safe-top))" }}
      >
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
        <section className="flex min-h-[calc(100dvh-5.5rem)] flex-col justify-center pb-16 pt-8 sm:pt-12">
          <Container size="content">
            <Stack gap={5} className="max-w-3xl animate-landing-rise">
              <Eyebrow>hub · développeur</Eyebrow>
              <Heading
                level={1}
                className="!text-[clamp(2.75rem,8vw,4.75rem)] !leading-[0.95] !tracking-[-0.04em]"
              >
                Tout ton métier de dev, au même endroit.
              </Heading>
              <Text
                size="lg"
                tone="muted"
                className="max-w-xl !text-base sm:!text-lg"
              >
                {SITE_DESCRIPTION}
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

        <section className="border-t border-border/80 py-20 sm:py-24" aria-labelledby="modules-title">
          <Container size="content">
            <Stack gap={3} className="mb-12 max-w-2xl">
              <Eyebrow>Modules</Eyebrow>
              <Heading id="modules-title" level={2} className="!text-3xl sm:!text-4xl">
                Tout ce que tu utilises déjà, dans un hub unique.
              </Heading>
              <Text tone="muted">
                Pas un outil de plus à apprendre : Overview, AI, CV, candidatures,
                snippets et budget. Tu ouvres un compte, tu retrouves tout.
              </Text>
            </Stack>
            <div className="grid gap-6 sm:grid-cols-2">
              {modules.map((mod, index) => (
                <article
                  key={mod.id}
                  className="group rounded-2xl border border-border/80 bg-card/60 p-6 shadow-[var(--dh-shadow-sm)] ring-1 ring-transparent backdrop-blur-sm transition duration-[var(--dh-duration)] hover:border-primary/25 hover:bg-card hover:shadow-[var(--dh-shadow-md)] hover:ring-primary/15 animate-landing-rise"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <Cluster gap={3} className="mb-3">
                    <mod.icon className="size-5 text-primary" aria-hidden />
                    <Text weight="medium">{mod.label}</Text>
                  </Cluster>
                  <Text size="sm" tone="muted">
                    {LANDING_PITCH[mod.id]}
                  </Text>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-t border-border/80 py-20 sm:py-24">
          <Container size="content">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-20">
              <Stack gap={3}>
                <Eyebrow>Comment ça marche</Eyebrow>
                <Heading level={2} className="!text-3xl sm:!text-4xl">
                  Trois étapes. Un hub.
                </Heading>
                <Text tone="muted">
                  Mobile-first, installable en PWA. Le même espace sur téléphone
                  et sur ordinateur.
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

        <section className="border-t border-border/80 py-20 sm:py-24">
          <Container size="content">
            <div className="grid gap-10 sm:grid-cols-2">
              <article className="border-t border-border pt-6">
                <KeyRound className="mb-4 size-5 text-primary" aria-hidden />
                <Heading level={3} className="!text-lg">
                  Connexion simple
                </Heading>
                <Text size="sm" tone="muted" className="mt-2">
                  Email et mot de passe, avec réinitialisation si tu l’as oublié.
                  Pas de compte tiers obligatoire.
                </Text>
              </article>
              <article className="border-t border-border pt-6">
                <ShieldCheck className="mb-4 size-5 text-primary" aria-hidden />
                <Heading level={3} className="!text-lg">
                  Tes données, ton compte
                </Heading>
                <Text size="sm" tone="muted" className="mt-2">
                  Un compte, des accès clairs. Les modules Pro restent derrière
                  un plan, le reste est prêt dès l’inscription.
                </Text>
              </article>
            </div>
          </Container>
        </section>

        <section className="border-t border-border/80 py-20 sm:py-24" aria-labelledby="faq-title">
          <Container size="content">
            <Stack gap={3} className="mb-10 max-w-2xl">
              <Eyebrow>Questions</Eyebrow>
              <Heading id="faq-title" level={2} className="!text-3xl sm:!text-4xl">
                Avant de créer un compte
              </Heading>
            </Stack>
            <div className="divide-y divide-border border-y border-border">
              {FAQS.map((item) => (
                <article key={item.question} className="py-6">
                  <Heading level={3} className="!text-base">
                    {item.question}
                  </Heading>
                  <Text size="sm" tone="muted" className="mt-2">
                    {item.answer}
                  </Text>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-t border-border/80 py-20 sm:py-28">
          <Container size="content">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-gradient-to-br from-primary/15 via-background to-background px-6 py-14 sm:px-12 sm:py-16">
              <div
                className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/20 blur-3xl"
                aria-hidden
              />
              <Stack gap={4} className="relative max-w-xl animate-landing-rise">
                <Heading level={2} className="!text-3xl sm:!text-4xl">
                  Rejoins hub.
                </Heading>
                <Text tone="muted">
                  Crée un compte en quelques secondes. Tes modules t’attendent :
                  AI, CV, candidatures, snippets et budget.
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
              © {new Date().getFullYear()} {SITE_NAME}
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
