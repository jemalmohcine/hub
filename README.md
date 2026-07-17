# DevHub — Phase 1 Hub Global

Hub développeur modular (mobile-first PWA) : auth Supabase, rôles, shell modules, settings, billing abstrait (mock, pas Stripe).

## Stack

- **Next.js** (App Router) + **Tailwind CSS 4.3.3**
- **shadcn/ui** (primitives dans `src/components/ui`)
- **Design system** (`src/design-system`) — API produit unique
- **Tokens** dans `src/assets/styles/` (primitives → semantic → `@theme`)
- **Supabase** (Auth + Postgres + RLS)
- **Vercel** + **PWA**

Voir `src/assets/styles/README.md` et `src/design-system/README.md`.

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
- `npm run build` — build production (Turbopack)
- `npm run start` — serveur production

## Structure

```
src/
  design-system/     # tokens + composants globaux (obligatoire pour l'UI)
  app/               # routes — compose uniquement le design system
  core/              # auth, billing, entitlements, module-registry
  shared/ui/         # formulaires métier (auth/settings) basés sur le DS
supabase/migrations/
```

Voir `src/design-system/README.md` pour les tokens et composants.
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
