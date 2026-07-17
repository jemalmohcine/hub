import Link from "next/link";
import { Button } from "@/shared/ui";

export default function LandingPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(45,212,191,0.22), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(15,118,110,0.15), transparent)",
        }}
      />
      <header className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white dark:text-[#0c1222]">
            H
          </div>
          <span className="text-lg font-semibold tracking-tight">DevHub</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sign-in">
            <Button variant="ghost">Connexion</Button>
          </Link>
          <Link href="/sign-up">
            <Button>Commencer</Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col px-4 pb-20 pt-10 sm:pt-20">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Developer Hub
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
          DevHub
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
          Un seul hub pour tes modules développeur — auth, privilèges, settings
          et abonnements. Mobile-first, installable en PWA.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/sign-up">
            <Button className="min-w-[10rem]">Créer un compte</Button>
          </Link>
          <Link href="/sign-in">
            <Button variant="secondary" className="min-w-[10rem]">
              Se connecter
            </Button>
          </Link>
        </div>

        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Modules",
              body: "Chaque outil dans un onglet. AI arrive en phase 2.",
            },
            {
              title: "Accès",
              body: "Rôles user/admin et entitlements par plan.",
            },
            {
              title: "Billing prêt",
              body: "Abstraction paiement ouverte — branche ton PSP plus tard.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-surface/70 p-5 backdrop-blur"
            >
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm text-muted">{item.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
