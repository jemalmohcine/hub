# Déploiement Vercel — DevHub (Nuxt 4)

Projet Vercel : **hub-dev** · Production : https://hub-onedev.vercel.app  
Supabase : **lfxiyrcfiieyxeziuglv**

## Variables (Preview + Production)

| Variable | Usage |
|----------|--------|
| `NUXT_PUBLIC_SUPABASE_URL` | Client + serveur |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | Client |
| `SUPABASE_SERVICE_ROLE_KEY` | Serveur uniquement (ingest, scripts) |
| `NUXT_PUBLIC_APP_URL` | OAuth redirects (`/auth/confirm`) |
| `VEILLE_INGEST_SECRET` | `POST /api/veille/ingest` |

Supabase Auth → Redirect URLs : `https://hub-onedev.vercel.app/auth/confirm` (+ preview si besoin).

Anciennes URLs Next : `/sign-in` et `/sign-up` redirigent vers `/auth/login` (query `next` conservée).

## CI (push `main`)

Workflow **Deploy main** (`.github/workflows/deploy-main.yml`) :

1. Vérifie les secrets GitHub (voir ci-dessous)
2. `supabase db push --include-all --yes`
3. Vercel déploie via l’intégration Git

Catalogue outils : workflow manuel **Dev tools catalogue** (`workflow_dispatch`).

## Build local

```bash
npm ci
npm run build
```
