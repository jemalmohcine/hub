# Parité Nuxt 4 ↔ Next (`main` post #79)

Référence : application Next sur `main` (hub, veille ingest, auth e-mail, PWA).

Légende : `[x]` porté et testé build · `[~]` partiel · `[ ]` manquant

## Stack

| Élément | Statut |
|---------|--------|
| Nuxt 4 + Nitro preset Vercel | [x] |
| `@nuxtjs/supabase` (cookies SSR, pas de `event.req.headers.get`) | [x] |
| Tailwind v4 + tokens `--dh-*` + DS global (`components/ds/*`) | [x] |
| Shell / nav (`AppShell`, bottom nav, safe areas) | [x] |
| PWA (`manifest.webmanifest`, icônes, `sw.js` sans cache auth/API) | [x] |
| Variables `NUXT_PUBLIC_*` + `VEILLE_INGEST_SECRET` | [x] |

## Routes publiques

| Route Next | Route Nuxt | Statut |
|------------|------------|--------|
| `/` | `/` | [x] |
| `/sign-in` | `/sign-in` → `/auth/login` | [x] |
| `/sign-up` | `/sign-up` → `/auth/sign-up` | [x] |
| `/forgot-password` | `/auth/forgot-password` | [x] |
| `/reset-password` | `/reset-password` → `/auth/update-password` | [x] |

## Auth

| Comportement | Statut |
|--------------|--------|
| E-mail + mot de passe | [x] |
| Confirmation e-mail (`/auth/confirm`) | [x] |
| Session après rechargement complet (SSR `serverSupabaseUser`) | [x] |
| ID utilisateur = JWT `sub` / `user.id` Supabase | [x] |
| Pas de mention Supabase visible | [x] |

## App (`/app/*`)

| Route | Statut | Notes |
|-------|--------|-------|
| `/app` → overview | [x] | |
| `/app/overview` | [x] | |
| `/app/ai` | [x] | Filtre défaut 7 jours (`feed_date`) |
| `/app/career` | [x] | CV + candidatures manuelles |
| `/app/career?tab=cv` | [x] | |
| `/app/career?tab=jobs` | [x] | |
| `/app/cv` | [x] | redirect |
| `/app/jobs` | [x] | redirect |
| `/app/snippets` | [x] | |
| `/app/expenses` | [~] | Liste services ; pas encore diagnostic IA complet |
| `/app/expenses?tab=tools` | [x] | Catalogue `dev_tools` |
| `/app/settings` | [x] | Profil + thème + sécurité consolidés |
| `/app/settings/account` | [~] | redirect → `/app/settings` |
| `/app/settings/appearance` | [~] | redirect |
| `/app/settings/security` | [~] | redirect |
| `/app/settings/billing` | [~] | redirect (Stripe non câblé côté Nuxt) |
| `/app/settings/modules` | [~] | redirect |
| `/admin` | [~] | Lecture stats/flags ; pas toggle flags |

## API / server

| Endpoint | Statut |
|----------|--------|
| `POST /api/veille/ingest` + `x-ingest-secret` → `veille_ia_items` | [x] |
| `POST /api/billing/webhook` | [x] |
| `POST /api/billing/checkout` | [ ] |
| `GET/POST /api/cron/ai-intel` | [ ] | Non utilisé sur main (ingest externe) |

## Fonctionnel métier

| Feature | Statut |
|---------|--------|
| Veille 7 jours (`metadata.feed_date` / colonne `feed_date`) | [x] |
| Ingest veille externe | [x] |
| CV builder + export PDF | [~] | Export via `window.print` (Next a rendu dédié) |
| Candidatures manuelles | [x] |
| Scraping offres emploi | [x] | Absent (volontaire) |
| Snippets CRUD | [x] | Composants Nuxt d’origine |
| Dépenses + advisor LLM | [~] | Liste services seulement |
| Notifications push veille | [ ] | |
| OAuth Google/GitHub | [x] | Absent (volontaire) |

## Copy / UX

| Règle | Statut |
|-------|--------|
| Copy FR humaine, sans tiret cadratin | [x] |
| Rebrand **hub** + logo `/icons/*` | [x] |

## Vérifications release

| Check | Statut |
|-------|--------|
| `npm run build` vert | en cours CI |
| Preview hub-dev Ready | en cours CI |
| `curl /sign-in` 200/redirect | en cours CI |
| `curl /app/*` pas de 500 | en cours CI |
