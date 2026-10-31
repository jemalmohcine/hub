# DevHub (hub)

Hub dev personnel — **Nuxt 4**, Supabase, Vercel.

## Modules

- **Veille IA** — `POST /api/veille/ingest`
- **Snippets** — code et notes (Supabase `dev_snippets`)
- **Profil** — CV + candidatures manuelles
- **Offres gratuites** — catalogue `dev_tools` + suivis

## Dev

```bash
cp .env.example .env
npm install
npm run dev
```

## Docs

- [`docs/MIGRATION-NUXT.md`](docs/MIGRATION-NUXT.md)
- [`DEPLOY.md`](DEPLOY.md)

## CI

Déploiement **Vercel** via l’intégration Git (push sur `main`). Les migrations Supabase sont appliquées **hors GitHub Actions** (assistant / CLI).

Catalogue outils : workflow manuel **`dev-tools-ingest.yml`** (`workflow_dispatch`).
