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

Push `main` → `.github/workflows/deploy-main.yml` (migrations Supabase) + déploiement Vercel.

Catalogue outils : workflow manuel `dev-tools-ingest.yml`.
