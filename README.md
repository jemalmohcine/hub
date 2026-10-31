# DevHub (hub)

Hub dev personnel — **Nuxt 4**, Supabase, Vercel.

## Modules

- **Veille IA** — fil quotidien (`POST /api/veille/ingest` pour l’agent Info Ai)
- **Snippets** — code et notes
- **Profil** — CV + suivi candidatures manuel
- **Offres gratuites** — catalogue tiers free / crédits / programmes (table `dev_tools` + `dev_tool_saves`)

## Dev

```bash
cp .env.example .env
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Docs

- [`docs/MIGRATION-NUXT.md`](docs/MIGRATION-NUXT.md) — architecture, env, migrations
- [`DEPLOY.md`](DEPLOY.md) — déploiement Vercel

## Scripts maintenance (GitHub Actions)

- `npm run dev-tools:ingest` — catalogue outils
- `npm run job-board:ingest` — purge / rappels (legacy `src/modules/job-board`)
