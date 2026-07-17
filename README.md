# DevHub — Phase 1 Hub Global

Hub développeur modular (mobile-first PWA) : auth Supabase, rôles, shell modules, settings, billing abstrait (mock, pas Stripe).

## Stack

- **Next.js** (App Router) + Tailwind
- **Supabase** (Auth + Postgres + RLS)
- **Vercel** (déploiement)
- **PWA** via `@ducanh2912/next-pwa`

## Setup local

1. Crée un projet [Supabase](https://supabase.com)
2. Dans le SQL Editor, exécute `supabase/migrations/001_hub_phase1.sql`
3. Active Email + OAuth (GitHub / Google) dans Authentication → Providers
4. Copie `.env.example` → `.env.local` et renseigne :

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BILLING_MOCK=true
```

5. Redirect URL OAuth : `http://localhost:3000/auth/callback`

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — développement
- `npm run build` — build production (+ service worker PWA)
- `npm run start` — serveur production

## Structure

```
src/
  app/               # routes (marketing, auth, app, admin, api)
  core/
    auth/            # Supabase clients, actions, getUser
    billing/         # PaymentProvider + MockPaymentProvider
    entitlements/    # plans → module access
    module-registry/ # tabs modules
  shared/ui/         # shell + composants
supabase/migrations/ # SQL Phase 1
```

## Billing

`getPaymentProvider()` retourne `MockPaymentProvider`.  
Settings → Billing : bouton **Activer Pro (mock)** met à jour `subscriptions` et débloque `module:ai`.

Pour brancher Stripe / Lemon Squeezy plus tard : implémente `PaymentProvider` et remplace le factory dans `src/core/billing/index.ts`.

## Admin

Passe un user en admin dans Supabase :

```sql
update public.profiles set role = 'admin' where email = 'toi@example.com';
```

## Déploiement Vercel

1. Push le repo GitHub
2. Import le projet sur Vercel
3. Ajoute les mêmes variables d'environnement
4. `NEXT_PUBLIC_APP_URL` = URL Vercel
5. Ajoute l'URL de callback OAuth Supabase

## Phase 2

Module AI Intelligence (feed, modèles, prix, repos) — placeholder `/app/ai`.
