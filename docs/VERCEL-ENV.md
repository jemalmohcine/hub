# Variables d'environnement (Vercel hub-dev)

Le projet Next lit **NEXT_PUBLIC_*** en priorité. Les noms **NUXT_PUBLIC_*** déjà configurés sur Vercel sont aussi acceptés au build (voir `next.config.ts`).

| Variable Vercel actuelle | Usage Next | Obligatoire |
|--------------------------|------------|-------------|
| `NUXT_PUBLIC_SUPABASE_URL` | URL projet (fallback → `NEXT_PUBLIC_SUPABASE_URL`) | Oui |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon (fallback → `NEXT_PUBLIC_SUPABASE_ANON_KEY`) | Oui |
| `NUXT_PUBLIC_APP_URL` | URL publique (emails, redirects) | Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Ingest veille, jobs serveur | Oui (ingest) |
| `VEILLE_INGEST_SECRET` | Header `x-ingest-secret` sur `POST /api/veille/ingest` | Oui (ingest) |

**Optionnel (recommandé pour clarté)** : ajouter sur Vercel les mêmes valeurs sous :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

Aucune suppression des `NUXT_PUBLIC_*` n’est requise tant que le fallback est en place.
