# Migration Nuxt 4 (DevHub)

> Décisions Mohcine (2026-10-31) — ce document remplace `docs/REFONTE-PLAN.md` en cas de conflit.

## Stack

| Avant | Après |
|-------|--------|
| Next.js 16 | **Nuxt 4.6** (Vue 3, TypeScript) |
| `@supabase/ssr` | **`@nuxtjs/supabase`** |
| Entitlements / billing mock | **App gratuite** — pas de paiement (webhook stub conservé) |
| Pipeline `ai_intel_*` + cron 3h | **Supprimé** — veille via `POST /api/veille/ingest` uniquement |

Supabase : projet `lfxiyrcfiieyxeziuglv`, **mêmes tables** (snippets, CV, veille, dev_tools, job_applications…).

## Structure

```
assets/css/          Tokens + Tailwind v4
components/ds/       Design system (Button, Input, Card, …)
components/{veille,snippets,shell}/
composables/         Nav modules, palette ⌘K
pages/               Routes App Router → pages Vue
server/api/          veille/ingest, billing/webhook
server/utils/        Ingest admin (veille, dev-tools)
shared/              Types & logique pure (veille, snippets, cv, …)
src/modules/job-board/  Legacy — maintenance GH Actions uniquement (scraping offres reporté)
supabase/migrations/ 027–029 sécurité + offres gratuites
```

## Routes app

| Route | Module |
|-------|--------|
| `/app/ai` | Veille IA (fil forum) |
| `/app/snippets` | Snippets |
| `/app/profil` | CV + candidatures manuelles |
| `/app/offres` | Catalogue offres / tiers gratuits + suivis |
| `/app/overview` | Aperçu |

Redirections : `/app/cv`, `/app/career` → profil / veille.

## Contrat ingest (inchangé)

- `POST /api/veille/ingest`
- Header `x-ingest-secret: $VEILLE_INGEST_SECRET`
- Body : voir `server/utils/veille/ingest-schema.ts` (identique à l’ancien schéma Zod)

## Migrations Supabase

| Fichier | Action |
|---------|--------|
| `027_subscriptions_rls_lockdown.sql` | Retire INSERT/UPDATE client sur `subscriptions` |
| `028_veille_remove_dev_seeds.sql` | Supprime lignes `[EXEMPLE DEV]` |
| `029_dev_tool_saves.sql` | Suivi utilisateur du catalogue offres |

**Note :** deux fichiers `025_*` existent historiquement ; ordre lexicographique OK. Ne pas renommer sur prod déjà migrée.

## Variables d’environnement (Vercel `hub-dev`)

```env
NUXT_PUBLIC_SUPABASE_URL=https://lfxiyrcfiieyxeziuglv.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # serveur uniquement
NUXT_PUBLIC_APP_URL=https://hub-onedev.vercel.app
VEILLE_INGEST_SECRET=...             # agent Info Ai
```

Supabase Auth → URL de redirection : `https://hub-onedev.vercel.app/auth/confirm`

## CI GitHub Actions

### Workflow `Deploy main` (push sur `main`)

Secrets **obligatoires** (Settings → Secrets → Actions) :

| Secret | Description |
|--------|-------------|
| `SUPABASE_ACCESS_TOKEN` | Token CLI Supabase (Dashboard → Account → Access Tokens) |
| `SUPABASE_DB_PASSWORD` | Mot de passe DB du projet |
| `SUPABASE_PROJECT_REF` | `lfxiyrcfiieyxeziuglv` |

Secrets **optionnels** (ingest catalogue manuel, Vercel les utilise aussi pour l’app) :

| Secret | Description |
|--------|-------------|
| `NUXT_PUBLIC_SUPABASE_URL` | URL API Supabase |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Classification dev_tools |
| `GITHUB_TOKEN` | Métriques GitHub (actions: read) |

Vercel reçoit les `NUXT_PUBLIC_*`, `SUPABASE_SERVICE_ROLE_KEY` et `VEILLE_INGEST_SECRET` dans le dashboard projet — pas besoin de les dupliquer pour le déploiement si l’intégration Git est branchée.

## Déploiement

```bash
npm run build   # Nitro preset vercel
```

Headers sécurité (CSP, HSTS implicite Vercel, X-Frame-Options…) : `nuxt.config.ts` → `nitro.routeRules`.
