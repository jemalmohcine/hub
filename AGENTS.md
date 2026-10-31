# DevHub — agent notes

Stack: **Nuxt 4** + Vue 3 + TypeScript, Supabase (`@nuxtjs/supabase`), Tailwind v4, Nitro on Vercel.

## Layout

- `components/ds/` — design system (seul point d’entrée UI)
- `shared/` — types et helpers sans framework
- `server/api/` — routes HTTP (ingest veille, webhook billing stub)
- `pages/` — routes ; auth via middleware global sur `/app/*`
- `src/modules/job-board/` — **legacy** scripts CI uniquement (hors app Nuxt)

## Règles

- Copy UI en **français**
- Pas de billing / entitlements (app gratuite)
- Ne pas casser `POST /api/veille/ingest` (schéma `server/utils/veille/ingest-schema.ts`)
- Snippets : données user en Supabase — ne pas migrer destructif

## Commandes

```bash
npm run dev
npm run build
npm run dev-tools:ingest
```

Voir `docs/MIGRATION-NUXT.md`.
