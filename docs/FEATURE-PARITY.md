# Parité Nuxt 4 ↔ ancienne app Next (`main` #79)

Référence fonctionnelle : hub post #79 (veille ingest externe, pas de scrape emploi).

**Design Nuxt** : charte distincte (papier chaud, violet, mobile 390px, accueil en 2 taps). Ce n’est pas un reskin Next.

Légende : `[x]` livré · `[—]` hors scope volontaire

## Stack

| Élément | Statut |
|---------|--------|
| Nuxt 4 + Nitro Vercel | [x] |
| DS global `components/ds/*` partout | [x] |
| Auth SSR (`serverSupabaseUser`, claims `sub` → user id client) | [x] |
| PWA + SW sans cache auth/API | [x] |
| Tree Next `src/` retiré | [x] |

## Routes publiques

| Route | Statut |
|-------|--------|
| `/`, `/sign-in`, `/sign-up`, auth complète | [x] |
| `/reset-password` → update-password | [x] |

## App

| Route | Statut |
|-------|--------|
| `/app/overview` (accès rapide Veille + Snippets) | [x] |
| `/app/ai` (7 j `feed_date`, alias `/app/veille`) | [x] |
| `/app/snippets` (copie 1 tap, ajout rapide N / ⌘↵) | [x] |
| `/app/outils` (JSON, encode, JWT, regex, UUID, time, couleur) | [x] |
| `/app/career`, `?tab=cv` / `?tab=jobs` | [x] |
| `/app/expenses`, `?tab=tools` | [x] |
| `/app/settings` + `/account` `/appearance` `/security` `/billing` `/modules` | [x] |
| `/admin` | [x] |
| Redirects `cv`, `jobs`, `profil`, `offres` | [x] |

## API

| Endpoint | Statut |
|----------|--------|
| `POST /api/veille/ingest` | [x] |
| `POST /api/billing/webhook` | [x] |
| `POST /api/expenses/diagnose-service` | [x] |
| `POST /api/expenses/diagnose-budget` | [x] |
| `POST /api/admin/module-flag` | [x] |
| `POST/DELETE /api/notifications/push` | [x] |
| `POST /api/billing/checkout` | [—] paiement hors scope |
| `GET/POST /api/cron/ai-intel` | [—] pas de fetch AI news in-app |

## Fonctionnel

| Feature | Statut |
|---------|--------|
| Veille ingest externe uniquement | [x] |
| CV + export PDF (iframe print Next) | [x] |
| Candidatures manuelles | [x] |
| Advisor dépenses (catalogue + LLM optionnel) | [x] |
| Push notifications (VAPID) | [x] |
| Admin toggle module flags | [x] |
| OAuth / scrape offres | [—] |

## UX Nuxt (Mohcine)

| Règle | Statut |
|-------|--------|
| Nouveau design (pas reskin Next) | [x] |
| Mobile-first 390px, bottom nav + bouton accueil | [x] |
| Palette ⌘K (modules, snippets, outils) | [x] |
| Snippet ultra rapide (sheet global, presse-papier, ⌘↵) | [x] |
| Veille groupée par jour (Aujourd’hui, Hier, …) | [x] |
| Outils dev client-side (section Outils) | [x] |
| Veille + Snippets + Outils depuis l’accueil | [x] |
| Empty / loading states DS | [x] |
| Thème clair / sombre, PWA | [x] |
| Copie FR pro, pas de mention Supabase UI | [x] |

## Release PR #80

| Check | Statut |
|-------|--------|
| `npm run build` | [x] local |
| Preview hub-dev Ready | CI |
| curl `/sign-in`, `/app/*` sans 500 | CI / preview |
