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

## Phase 2 — AI Intelligence

Module Pro `/app/ai` : digest multi-sources (4 piliers), merge cross-sites, saves + filtres.

1. Applique `supabase/migrations/003_ai_intelligence.sql` (SQL Editor ou `supabase db push`)
2. Ajoute dans `.env.local` / Vercel / GitHub Actions secrets :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TAVILY_API_KEY` (optionnel — découverte de nouveaux sites)
   - `CRON_SECRET` (optionnel — trigger manuel local via `/api/cron/ai-intel`)
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` (+ `VAPID_SUBJECT`) pour les push PWA
   - `NEXT_PUBLIC_APP_URL` (URL prod, utilisée aussi pour les push)
3. Scrape AI Intel : **GitHub Actions** (`.github/workflows/ai-intel-ingest.yml`)
   - **À chaque merge sur `main`** (push)
   - **Chaque matin** : schedule `0 1 * * *` UTC
   - Manuel : Actions → « AI Intel Ingest » → Run workflow (`full` ou `i18n`)
4. Notifications téléphone (PWA) :
   - Applique `supabase/migrations/007_push_subscriptions.sql`
   - Sur le téléphone : installer DevHub (Ajouter à l’écran d’accueil)
   - Settings → Langue & apparence → **Activer les alertes**
   - Après chaque scrape, s’il y a une alerte AI, une notif système est envoyée aux appareils Pro abonnés
5. Test local :
   ```bash
   npm run ai-intel:ingest
   # ou
   curl -X POST http://localhost:3000/api/cron/ai-intel \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

Secrets GitHub requis pour le workflow : `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (et `TAVILY_API_KEY` / `NEXT_PUBLIC_APP_URL` si tu les utilises).