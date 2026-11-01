# Variables d'environnement (Vercel hub-dev)

Le projet Next lit **`NEXT_PUBLIC_*` en priorité**. Les noms **`NUXT_PUBLIC_*`** déjà présents sur Vercel sont acceptés au build et dans le runtime (voir `next.config.ts` et `src/core/auth/supabase/*`).

## Configurées sur hub-dev (connues)

| Nom sur Vercel | Lu par Next | Rôle |
|----------------|-------------|------|
| `NUXT_PUBLIC_SUPABASE_URL` | Oui (fallback URL) | Auth + données. Preview PR #80 : `https://lfxiyrcfiieyxeziuglv.supabase.co` |
| `NUXT_PUBLIC_SUPABASE_ANON_KEY` | Oui (fallback anon) | Auth client / SSR |
| `NUXT_PUBLIC_APP_URL` | Oui (fallback origin) | Canonical, emails, VAPID subject |
| `SUPABASE_SERVICE_ROLE_KEY` | Oui | `POST /api/veille/ingest`, admin serveur |
| `VEILLE_INGEST_SECRET` | Oui | Header `x-ingest-secret` sur ingest veille |

**Manquantes sur hub-dev (optionnelles)** : toutes les autres variables ci-dessous. L’app tourne sans elles ; les features associées restent désactivées ou en mode catalogue.

## Toutes les variables lues par le code Next

### Obligatoires en production (auth + app)

| Variable | Fallback | Statut hub-dev |
|----------|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `NUXT_PUBLIC_SUPABASE_URL` | OK via NUXT_* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NUXT_PUBLIC_SUPABASE_ANON_KEY` | OK via NUXT_* |
| `NEXT_PUBLIC_APP_URL` | `NUXT_PUBLIC_APP_URL` | OK via NUXT_* |

### Ingest veille (externe)

| Variable | Statut hub-dev |
|----------|----------------|
| `VEILLE_INGEST_SECRET` | OK |
| `SUPABASE_SERVICE_ROLE_KEY` | OK |

### Auth / billing / PWA (optionnel)

| Variable | Usage |
|----------|--------|
| `NEXT_PUBLIC_BILLING_MOCK` | Mock Stripe (`true` = checkout simulé) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Notifications push navigateur |
| `VAPID_PRIVATE_KEY` | Envoi push serveur |
| `VAPID_SUBJECT` | Contact push (sinon `NEXT_PUBLIC_APP_URL`) |

### IA / LLM (optionnel)

| Variable | Usage |
|----------|--------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | Gemini direct |
| `GEMINI_API_KEY` | Alias Gemini |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway |
| `VERCEL_OIDC_TOKEN` | Gateway via OIDC |
| `AI_INTEL_LLM_MODEL` | Modèle veille |
| `AI_INTEL_LLM_BUDGET` | Budget appels / run |
| `AI_INTEL_LLM_MIN_INTERVAL_MS` | Throttle |
| `AI_INTEL_LLM_DEBUG` | Logs debug |
| `EXPENSES_LLM_MODEL` | Conseiller dépenses |
| `EXPENSES_LLM_DEBUG` | Logs debug |
| `SNIPPETS_LLM_MODEL` | Catégorisation / recherche snippets |
| `DEV_TOOLS_LLM_MODEL` | Classification catalogue outils |
| `DEV_TOOLS_LLM_BUDGET` | Budget classification |
| `DEV_TOOLS_LLM_MIN_INTERVAL_MS` | Throttle |
| `DEV_TOOLS_LLM_DEBUG` | Logs debug |

### Scraping / collecte (optionnel, pipelines legacy)

| Variable | Usage |
|----------|--------|
| `FIRECRAWL_API_KEY` | Scrape articles veille |
| `AI_INTEL_FIRECRAWL_PAGES` | Limite pages |
| `AI_INTEL_ARTICLE_SCRAPES` | Budget scrape |
| `AI_INTEL_REPO_SCRAPES` | Budget repos |
| `AI_INTEL_TOOL_SCRAPES` | Budget outils |
| `GITHUB_TOKEN` | API GitHub (trending, outils) |
| `TAVILY_API_KEY` | Découverte sources |
| `CRON_SECRET` | `GET/POST /api/cron/ai-intel` |
| `DEV_TOOLS_MIN_STARS` | Ingest outils |
| `DEV_TOOLS_PER_TOPIC` | Ingest outils |
| `DEV_TOOLS_REFRESH_DAYS` | Rafraîchissement LLM outils |

### Runtime Node

| Variable | Usage |
|----------|--------|
| `NODE_ENV` | production / development |

## Recommandation clarté (non bloquant)

Dupliquer sur Vercel les trois `NEXT_PUBLIC_*` avec les mêmes valeurs que les `NUXT_PUBLIC_*` existants. Aucune suppression des `NUXT_PUBLIC_*` n’est requise.

## Vérifier l’ingest veille

```bash
curl -sS -X POST "$APP_URL/api/veille/ingest" \
  -H "content-type: application/json" \
  -H "x-ingest-secret: $VEILLE_INGEST_SECRET" \
  -d '{"items":[]}'
```

Réponse attendue : `200` avec `{"ok":true,...}` (table vide acceptée si le body est valide).
