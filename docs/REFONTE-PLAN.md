# Plan de refonte DevHub (hub)

**Statut :** audit et cadrage uniquement — aucune modification applicative dans ce livrable.  
**Production :** https://hub-onedev.vercel.app  
**Contexte :** migration vers un projet Supabase neuf (données historiques jetables).  
**Périmètre refonte :** Snippets, Veille IA (`/app/ai` + contrat stable `POST /api/veille/ingest`), CV Builder, catalogue d’outils (onglet Dépenses). **Hors scope :** scraping job board (`/app/career?tab=offers`, module `job-board`, workflows GitHub associés) — laisser tel quel.

---

## Sommaire

1. [Architecture actuelle et problèmes](#1-architecture-actuelle-et-problèmes)
2. [Structure cible](#2-structure-cible)
3. [Design system](#3-design-system)
4. [UX par module](#4-ux-par-module)
5. [Revue sécurité](#5-revue-sécurité)
6. [Plan d’implémentation par PRs](#6-plan-dimplémentation-par-prs)

---

## 1. Architecture actuelle et problèmes

### 1.1 Couches prévues vs réalité

Le projet documente une architecture en couches dans `AGENTS.md` et `eslint.config.mjs` :

```
assets/styles → components/ui (shadcn) → design-system → lib / core → modules → shared/ui → app
```

Les imports inter-couches sont en partie enforceés (`no-restricted-imports` sur `@/components/ui/*` et Radix hors `design-system`). C’est sain, mais plusieurs modules et écrans contournent l’intention « une API produit » en accumulant de la logique UI monolithique.

| Couche | Chemin | Rôle |
|--------|--------|------|
| Tokens | `src/assets/styles/` | Primitives, sémantique, `@theme` Tailwind v4 |
| shadcn | `src/components/ui/` | 12 primitives |
| Design system | `src/design-system/` | ~28 fichiers, barrel `@/design-system` |
| Core | `src/core/` | Auth, entitlements, billing mock, i18n, registry |
| Modules | `src/modules/` | 11 dossiers fonctionnels |
| Shared | `src/shared/ui/` | Shell, auth forms, `ModulePage`, nav mobile |
| App | `src/app/` | Routes App Router, 3 API routes métier |

**Auth / session :** Next.js 16 utilise `src/proxy.ts` (matcher global) qui délègue à `src/core/auth/supabase/middleware.ts` — pas de `middleware.ts` à la racine. Protection `/app` et `/admin` par redirection vers `/sign-in`.

**Registry modules :** `src/core/module-registry/index.ts` — source de vérité pour labels, href, entitlements, ordre sidebar. Incohérence : libellés sidebar souvent en anglais (`Overview`, `CV Builder`) alors que le copy produit est en français (`core/i18n`, pages).

### 1.2 Cartographie des modules

| Module registry | Route principale | Code |
|-----------------|------------------|------|
| `overview` | `/app/overview` | `modules/today/` + landing cards |
| `ai` | `/app/ai` | `modules/ai-intel/` (veille + legacy) |
| `cv` + `jobs` | `/app/career?tab=*` | `career/`, `cv-builder/`, `job-board/`, `job-tracker/` |
| `snippets` | `/app/snippets` | `dev-snippets/` |
| `expenses` | `/app/expenses` | `dev-expenses/` + `dev-tools/` (catalogue) |
| (hors registry) | `/admin` | `(admin)/` flags modules |
| **Hors scope** | offres / scrape | `job-board/` (~80 fichiers), scripts `job-board-ingest.ts` |

Redirections legacy utiles mais bruitantes : `src/app/(app)/app/cv/page.tsx` et `jobs/page.tsx` → `/app/career`.

### 1.3 Problèmes structurels

#### Double pipeline « Veille IA »

Deux modèles coexistent :

1. **Nouveau (prod UI)** — table `veille_ia_items`, ingest externe `POST /api/veille/ingest` (`src/app/api/veille/ingest/route.ts` → `modules/ai-intel/veille/ingest.ts`), UI `VeilleWorkspace` exportée depuis `modules/ai-intel/ui/ai-intel-workspace.tsx` (nom de fichier legacy).
2. **Ancien (encore exécutable)** — tables `ai_intel_*`, pipeline `modules/ai-intel/ingest.ts`, cron manuel `src/app/api/cron/ai-intel/route.ts`, workflow `.github/workflows/ai-intel-ingest.yml`, script `scripts/ai-intel-ingest.ts`.

La page `/app/ai` ne consomme plus `getAiIntelFeed()` (`modules/ai-intel/queries.ts`) mais `getVeilleItemsRecent()` (`modules/ai-intel/veille/queries.ts`). **`getAiIntelFeed` et une grande partie de l’UI RSS (`feed-item-row.tsx`, `feed-section.tsx`, `feed-stats-bar.tsx`, `item-detail-modal.tsx`, `date-range-picker.tsx`, `save-button.tsx`) ne sont plus importées par l’app** — code mort ou réservé à une refonte abandonnée (~15 fichiers + collectors/enrich sous `modules/ai-intel/`).

Liens deep still partiellement legacy : `modules/ai-intel/item-link.ts` expose encore `?key=` et onglets `urgent|github|tools` non utilisés par la page actuelle.

#### Module `career` comme fourre-tout

`src/app/(app)/app/career/page.tsx` charge en une requête page : CV, offres scrapées, candidatures, prefs job search. Mélange **in scope** (CV) et **hors scope** (offres). UX et perf : waterfall de requêtes même quand l’utilisateur n’ouvre que l’onglet CV.

#### Fichiers UI monolithiques

| Fichier | Lignes (approx.) | Problème |
|---------|------------------|----------|
| `modules/dev-snippets/ui/snippets-workspace.tsx` | ~940 | formulaire, liste, recherche, dossiers, web search — tout en un client component |
| `modules/job-board/ui/job-board-workspace.tsx` | ~790 | hors scope refonte mais alourdit le bundle career |
| `modules/cv-builder/ui/cv-form.tsx` | large | sections répétitives, difficile à parcourir |

#### Duplication navigation / tabs

- Sidebar : `shared/ui/app-shell.tsx` + registry.
- Mobile : `shared/ui/mobile-bottom-nav.tsx` (4 onglets + sheet « Plus ») — **liste modules dupliée** (href, icônes, règles active) au lieu d’être dérivée du registry.
- Onglets internes : `shared/ui/tab-nav.tsx` (expenses), tabs inline dans `career-workspace.tsx`, `cv-builder-workspace.tsx`, `ai-intel-workspace.tsx` — **pas de primitive DS unifiée** pour segmented control.

#### Migrations Supabase

- 27 fichiers dans `supabase/migrations/` ; **deux fichiers `025_*`** (`025_job_search_last_scraped.sql`, `025_job_user_listings_ttl.sql`) — risque d’ordre ambigu sur environnement neuf.
- `026_veille_ia.sql` **seed des lignes `[EXEMPLE DEV]`** en base — acceptable en dev, à purger en prod après migration (commentaire L92–93 du SQL).

#### i18n fragmentée

- Copy global : `core/i18n/ui-copy.ts`.
- Veille : `modules/ai-intel/i18n/locale.ts` + actions i18n legacy.
- Shell mobile : objet inline `SHELL_COPY` dans `app-shell.tsx`.
- Registry : descriptions FR, labels EN.

#### Billing / entitlements

- Entitlements dérivés du plan en DB (`getHubUser` → `entitlementsForPlan` dans `core/entitlements/index.ts`).
- Mock billing : `NEXT_PUBLIC_BILLING_MOCK`, `mockUpgradePlan` dans `core/auth/actions.ts`.
- Webhook stub sans auth : `app/api/billing/webhook/route.ts`.

### 1.4 Candidats à suppression (après validation produit)

| Élément | Justification |
|---------|----------------|
| Pipeline `ai_intel_*` (ingest, collectors, enrich, scrape, cron GH si veille externe seule) | Remplacé par `veille_ia_*` + agent Info Ai |
| UI morte `feed-*`, `item-detail-modal`, `date-range-picker` (hors tests) | Non référencée |
| `ai_intel_sources`, items, saves, reads, runs (tables) | Après cutover veille, inutiles sur Supabase neuf |
| Routes/deep links `?key=`, `parseAiFeedTab` | Legacy inbox |
| Doublon nom `ai-intel-workspace.tsx` | Renommer en `veille-workspace.tsx` lors du nettoyage |

**Ne pas supprimer (hors scope mais actif) :** tout `modules/job-board/`, `job-tracker/` onglet candidatures, workflows job board.

### 1.5 Points positifs à conserver

- Contrat ingest veille documenté (`veille/ingest-schema.ts`, tests `ingest-schema.test.ts`).
- RLS présente sur quasi toutes les tables user-scoped.
- Service role confiné à `createAdminClient()` (`core/auth/supabase/admin.ts`) + scripts ingest.
- ESLint layering, conventions queries/actions documentées dans `AGENTS.md`.

---

## 2. Structure cible

### 2.1 Arborescence recommandée

```
src/
  app/                    # Routes uniquement : fetch + ModulePage + Suspense
  assets/styles/          # Tokens (--dh-*, @theme)
  components/ui/          # shadcn seul
  design-system/          # API produit + patterns (nav, feed, editor)
  lib/                    # Pur : dates, http, scrape, ai/model, slug…
  core/                   # Auth, entitlements, registry, billing interface
  modules/
    veille/               # Ex-ai-intel/veille + UI feed (renommage progressif)
    snippets/
    cv/
    dev-tools/            # Catalogue (consommé par expenses)
    dev-expenses/
    career/               # Shell onglets ; job-board importé seulement pour tabs hors refonte
    notifications/
    today/                # Overview digest
  shared/ui/              # AppShell, ModulePage, auth — mince
```

**Règle :** un module = `queries.ts`, `actions.ts`, `types.ts`, `ui/*.tsx`. Pas d’import `modules/*/ui` cross-module (promotion vers `design-system` ou `shared/ui`).

### 2.2 Routes cibles (UX)

| Besoin | Route actuelle | Route cible (proposition) |
|--------|----------------|---------------------------|
| Veille | `/app/ai` | `/app/ai` (inchangé, SEO mental « AI ») |
| Snippets | `/app/snippets` | idem |
| CV | `/app/career?tab=cv` | `/app/cv` page dédiée + career = hub emploi seulement **post-refonte** (phase tardive) |
| Outils | `/app/expenses?tab=tools` | `/app/tools` ou onglet DS unifié |
| Overview | `/app/overview` | `/app` ou `/app/overview` |

Phase 1 : garder URLs pour ne pas casser bookmarks ; phase 3 : redirects propres.

### 2.3 Données Supabase cible

**Conserver :** `profiles`, `user_preferences`, `subscriptions`, `module_flags`, `veille_ia_*`, `dev_snippets*`, `cv_documents`, `dev_expenses*`, `dev_tools`, notifications/push.

**Déprécier puis drop (migration dédiée) :** `ai_intel_*`, `ai_intel_sources`, données job board si un jour scope réduit (non demandé maintenant).

**Nettoyage prod :** DELETE `veille_ia_items` WHERE `'exemple-dev' = ANY(tags)` ou équivalent.

### 2.4 Registry unifié

Étendre `ModuleDefinition` avec :

- `labelKey` → `core/i18n/ui-copy.ts`
- `navGroup`: `primary` | `secondary` | `settings`
- `mobileTab`: boolean (4 slots bottom nav)

Une seule fonction `getNavItems(locale)` consommée par `app-shell` et `mobile-bottom-nav`.

---

## 3. Design system

### 3.1 État des tokens

Fichiers clés :

- Primitives : `assets/styles/tokens/*.css` (spacing, typography, radius, shadows, layout)
- Sémantique : `assets/styles/semantic/colors.css`
- Bridge Tailwind : `assets/styles/theme.css` (`@theme inline`)
- Variables produit `--dh-*` déjà utilisées (`--dh-sidebar-w`, `--dh-space-*`, `--dh-text-*` dans composants)

**Problèmes :**

- Double nomenclature shadcn (`--background`, `--primary`) et `--dh-*` — documenté dans `design-system/README.md` mais pas de table de correspondance unique.
- Tailles texte : règle AGENTS « `text-[length:var(--dh-text-*)]` » — audits spot montrent encore des utilitaires Tailwind génériques dans vieux modules.

### 3.2 Proposition tokens (refonte)

| Famille | Action |
|---------|--------|
| **Couleur** | 3 surfaces (`canvas`, `elevated`, `inset`), bordures `hairline` / `strong`, états `critical` / `warning` / `success` alignés severities veille |
| **Typo** | Echelle `--dh-text-xs` → `--dh-text-2xl`, `--dh-font-mono` pour snippets, `--dh-font-display` optionnel landing |
| **Rayon** | `--dh-radius-sm/md/lg/xl` — cards feed = `lg`, modals = `xl` |
| **Motion** | `assets/styles/tokens/motion.css` — durées 150/250ms, respect `prefers-reduced-motion` |
| **Density** | prop `dense` déjà sur `EmptyState` — étendre à listes feed et snippets |

### 3.3 Thèmes clair / sombre

- `design-system/components/theme.tsx` + `ThemeSync` dans shell (pref user `user_preferences.theme`).
- **Cible :** contraste WCAG AA sur texte muted, severities veille lisibles en dark (badges `critique` ≠ rouge pur #ff0000).
- Preview CV : themes CV (`cv-builder/ui/theme-picker.tsx`) **découplés** du theme app — documenter la différence « document print » vs « UI chrome ».

### 3.4 Composants à formaliser

| Composant DS | Usage refonte |
|--------------|---------------|
| `FeedList` / `FeedRow` | Veille forum-style (titre + 1–2 lignes + meta) |
| `FilterChipBar` | Veille + snippets tags |
| `SegmentedTabs` | Remplacer tab-nav ad hoc |
| `SplitWorkspace` | Snippets (sidebar dossiers + main), CV (form + preview) |
| `CodeBlock` + copy | Snippets (bouton copy accessible) |
| `StickyModuleHeader` | Filtres jour veille collants au scroll |
| `CommandPalette` (option phase 2) | Recherche snippets + jump modules |

Garder shadcn encapsulé : seuls `dialog`, `sheet`, `button`, etc. via `design-system`.

### 3.5 Navigation & layout

**Desktop :** sidebar fixe (`app-shell.tsx` L85+) — élargir zone contenu max-width par module (veille = `max-w-3xl` lecture, snippets = `max-w-6xl`).

**Mobile :** bottom nav 4 items — **dériver du registry** ; sheet « Plus » pour Dépenses + Réglages.

**ModulePage :** `shared/ui/module-page.tsx` — conserver gate entitlement + upsell Pro ; harmoniser header (titre registry + description + actions slot).

**Landing :** `app/page.tsx` déjà riche (`design-system` Atmosphere) — aligner visuellement avec app post-refonte (même `--dh-brand`).

---

## 4. UX par module

### 4.1 Snippets (`modules/dev-snippets/`)

**État actuel :** workspace unique (`snippets-workspace.tsx`) — dossiers (`dev_snippet_categories`), pin, tags GIN, recherche fuzzy + LLM (`llm-search.ts`), image URL ou data URL jusqu’à ~700k chars (`image.ts`).

**Cible UX :**

| Zone | Comportement |
|------|--------------|
| **Organisation** | Sidebar dossiers + compteurs ; drag reorder optionnel phase 2 ; dossiers suggérés (`SUGGESTED_SNIPPET_FOLDERS` dans `types.ts`) onboarding |
| **Liste** | Cartes compactes : titre, langage badge, 2 lignes preview monospace, tags max 3 visibles |
| **Recherche** | Barre unique : filtre local instantané + mode « smart search » (LLM) explicite avec indicateur coût/latence |
| **Tags** | Autocomplete depuis tags existants ; pas de typos doublons (fold case via `lib/text`) |
| **Copy** | CTA principal par snippet ; toast « Copié » (`useToast`) ; raccourci clavier quand focus liste |
| **Création** | Sheet ou Dialog (DS) au lieu de panneau inline permanent — réduit bruit mobile |
| **Images** | Migrer long terme vers Supabase Storage bucket privé + signed URL (aujourd’hui data URL en row — lourd pour Postgres) |

**Perf :** pagination ou virtualisation si >100 snippets.

### 4.2 Veille IA (`/app/ai`)

**État actuel :** `VeilleWorkspace` — tri `sortVeilleItems`, filtres catégorie/provider, jour ± navigation, recherche texte, modal `veille-detail-modal.tsx`, saves `veille_ia_saves`.

**Cible UX (forum-like, simple) :**

```
┌─────────────────────────────────────────┐
│  ← Jour →    [ chips catégories ]  🔍   │
├─────────────────────────────────────────┤
│ ● CRITIQUE  Titre une ligne             │
│   Résumé 1–2 phrases max, pas de mur.   │
│   OpenAI · sécurité                     │
├─────────────────────────────────────────┤
│   Titre …                               │
└─────────────────────────────────────────┘
```

| Règle | Détail |
|-------|--------|
| **Ordre** | `critique` puis `elevee` puis reste (`veille/sort.ts` — renforcer tests) |
| **Ligne liste** | Titre + `summary` seulement ; `quoi`/`impact` réservés modal |
| **Détail** | Modal ou drawer : sections bullet, lien source externe visible, versions affectées |
| **Filtres** | Chips discrets (`VEILLE_FILTER_CHIPS`) ; pas de date-range picker lourd legacy |
| **Critique en haut** | Bandeau optionnel si ≥1 critique ce jour (lien depuis `today/queries.ts` déjà partiel) |
| **Saved** | Icône bookmark discrète (`veille-save-button.tsx`) |
| **Demo dev** | Garder `DEV_VEILLE_DEMO_*` (`veille/demo-seed.ts`) mais bannière « données demo » |

**Contrat API stable :** ne pas modifier `veilleIngestItemSchema` (`veille/ingest-schema.ts`) — champs `date`, `category`, `provider`, `severity`, `title`, `summary`, `link`, etc. Documenter version schema en en-tête README.

**Supprimer de l’UX :** onglets RSS, stats bar legacy, traduction inline legacy si agent externe fournit déjà le FR.

### 4.3 CV Builder (`modules/cv-builder/`)

**État actuel :** nested in career tab ; `cv-builder-workspace.tsx` panels edit/preview/themes/export ; PDF `exportCvPdf` (`export.ts`) ; multi-documents ; tailor job (`job-tailor-card.tsx`).

**Cible UX — parcours :**

1. **Accueil CV** — liste documents + « Nouveau CV » + duplicate.
2. **Édition stepper** — `CvFormTabs` simplifié : Profil → Expérience → Compétences → Projets → Formation (progress visible).
3. **Preview live** — split desktop ; mobile toggle Preview via `SegmentedTabs`.
4. **Templates** — `theme-picker.tsx` : 3–4 templates print-first (classic, compact, sidebar) avec preview thumbnail.
5. **Export** — PDF primary ; JSON/Markdown secondaires (déjà présents) ; nom fichier `{slug}-cv.pdf`.
6. **Readiness** — garder `cv-readiness-card.tsx` comme checklist avant export.

**Hors refonte immédiate :** tailor à une offre (job board) — masquer ou reléguer si tab offres hors scope marketing.

### 4.4 Catalogue d’outils (`modules/dev-tools/ui/tools-directory.tsx`)

Consommé depuis `/app/expenses?tab=tools`. **Cible :** grille cards avec scores (`scoring.ts`), filtres catégorie / free tier, lien vers fiche outil (sheet) — UX type « annuaire », pas tableau dense. Aligner visuellement avec refonte expenses (même `TabNav` → `SegmentedTabs`).

### 4.5 Overview (`modules/today/`)

Digest multi-modules (`today/queries.ts`) — simplifier cartes après refonte veille (signaux critiques veille en tête). Push banner (`push-enable.tsx`) : moins intrusif (inline card vs bandeau).

### 4.6 Hors scope (inchangé)

Job board scrape, collectors (`modules/job-board/collectors/*`), silent refresh UI — **aucune refonte UX** dans ce programme.

---

## 5. Revue sécurité

Classement : **Critique** → **Élevé** → **Modéré** → **Faible**.  
Audit npm exécuté le 2026-10-31 : **46 vulnérabilités** (devDependencies incluses) — **2 critical** npm advisory chain, nombreuses **high** sur `next@16.2.10`.

### 5.1 Critique

| # | Finding | Fichiers / preuve | Recommandation |
|---|---------|-------------------|----------------|
| C1 | **Escalade plan via RLS `subscriptions`** — policies permettent INSERT/UPDATE own row sans restreindre `plan` / `status` | `supabase/migrations/001_hub_phase1.sql` L158–167 ; entitlements lus depuis DB dans `core/auth/get-user.ts` L57–66 | Retirer policies client write ; mutations subscription **service role only** ou RPC `security definer` ; webhook PSP vérifie signature |
| C2 | **Next.js 16.2.10** — chaîne advisories **RCE** (Image Optimization, `next/og`, Windows hosting, etc.), fix ≥ **16.3.8** / **16.4.x** selon advisory | `package.json` L27 ; `npm audit` | Monter `next` + `eslint-config-next` en PR dédiée, redeploy, smoke tests |

### 5.2 Élevé

| # | Finding | Détail | Recommandation |
|---|---------|--------|----------------|
| H1 | **`NEXT_PUBLIC_BILLING_MOCK=true`** en prod possible | `.env.example` L9–10 ; `mockUpgradePlan` | Interdire en prod (assert build ou env Vercel) ; mock réservé preview |
| H2 | **Webhook billing sans auth** | `app/api/billing/webhook/route.ts` L4–13 — accepte JSON arbitraire | Vérifier signature PSP ; rejeter 401 si secret absent |
| H3 | **Données exemple veille en prod** | `026_veille_ia.sql` INSERT `[EXEMPLE DEV]` | Migration DELETE ou ne pas appliquer seeds prod |
| H4 | **Dépendances `zod` / `undici` / `@ai-sdk/*`** — high/moderate (DoS validation, etc.) | `npm audit` | `npm audit fix` + bump `@ai-sdk/google`, `zod` ≥ 4.6.6 |
| H5 | **Absence headers sécurité HTTP** | `next.config.ts` — pas de `headers()` CSP, HSTS, X-Frame-Options | Ajouter policy stricte (nonce scripts si possible), HSTS sur Vercel |

### 5.3 Modéré

| # | Finding | Détail | Recommandation |
|---|---------|--------|----------------|
| M1 | **`job_listings` lisibles par tout authentifié** | `012_job_listings.sql` L42–44 | Acceptable pour hub perso ; documenter fuite métadonnées offres entre users si multi-tenant un jour |
| M2 | **`dev_tools` read all authenticated** | `015_dev_tools.sql` L81–83 | OK catalogue public ; pas de write client (ingest service role only) |
| M3 | **`veille_ia_items` SELECT global authenticated** | `026_veille_ia.sql` L79–83 | OK fil feed partagé ; pas INSERT client (ingest admin) — **vérifier absence policy INSERT** (OK today) |
| M4 | **Cron `/api/cron/ai-intel`** — GET supporté | `route.ts` L48–49 | Limiter POST only ; rate limit Vercel firewall |
| M5 | **Snippets images data URL ~700k** en row | `dev-snippets/image.ts`, migration `017` | Risque DoS stockage ; limiter taille serveur + Storage |
| M6 | **Admin layout** — gate `profile.role` | `(admin)/layout.tsx` L12 | OK ; s’assurer role admin non self-grantable (policy profiles update own sans role — **vérifier trigger** empêche role escalation) |
| M7 | **Secrets ingest** — comparaison non constant-time | `veille/ingest/route.ts` L7–10 | Acceptable ; longueur secret ≥ 32 octets (doc `.env.example`) |

### 5.4 Faible

| # | Finding | Recommandation |
|---|---------|----------------|
| F1 | `CRON_SECRET` / `VEILLE_INGEST_SECRET` — fail closed si unset | OK pattern ; monitor 401 spikes |
| F2 | `NEXT_PUBLIC_*` keys Supabase + VAPID — expected leak surface | RLS must hold (C1 fix essential) |
| F3 | Pas de rate limit app-level sur `searchDevSnippets` LLM | Throttle user + budget env |
| F4 | Legacy pipeline ai-intel encore déployable | Réduit surface en supprimant cron + route |

### 5.5 Service role — usages (inventaire)

| Consommateur | Fichier |
|--------------|---------|
| Veille ingest API | `modules/ai-intel/veille/ingest.ts` |
| Legacy ai-intel ingest | `modules/ai-intel/ingest.ts` |
| Dev tools nightly | `modules/dev-tools/ingest.ts` |
| Job board | `modules/job-board/ingest.ts`, `notify.ts`, `listing-purge.ts` |
| Notifications push | `modules/notifications/create.ts`, `push.ts` |

Tous passent par `createAdminClient()` — **ne jamais** importer admin client dans composants client.

### 5.6 Auth middleware

`updateSession` : refresh cookie Supabase, redirect unauthenticated `/app` → `/sign-in?next=`, auth routes → overview si session. **Gap :** pas de vérification email confirmé, pas de MFA (hors scope). **PWA assets** exclus matcher — OK.

---

## 6. Plan d’implémentation par PRs

Principe : **PRs petites, reviewables**, ordre par risque produit + dette bloquante. Job board **exclu** des PRs UX (sauf fixes sécu transverses).

### Phase 0 — Sécurité & hygiène (priorité max)

| PR | Contenu | Fichiers touchés |
|----|---------|------------------|
| 0.1 | Bump `next` / `eslint-config-next`, CI green | `package.json`, lockfile |
| 0.2 | RLS subscriptions : drop client write ; RPC admin ou edge function upgrade | nouvelle migration SQL, `core/auth/actions.ts`, billing |
| 0.3 | Headers sécurité + webhook stub reject default | `next.config.ts`, `api/billing/webhook/route.ts` |
| 0.4 | Purge seeds `[EXEMPLE DEV]` + doc prod | migration SQL |
| 0.5 | `npm audit fix` (sans `--force` breaking shadcn sauf PR dédiée) | lockfile |

### Phase 1 — Fondations design system

| PR | Contenu |
|----|---------|
| 1.1 | Table tokens `--dh-*` ↔ shadcn ; doc `assets/styles/README.md` |
| 1.2 | Composants `SegmentedTabs`, `FilterChipBar`, `FeedRow` |
| 1.3 | Nav registry-driven : refactor `app-shell.tsx` + `mobile-bottom-nav.tsx` |
| 1.4 | i18n registry labels FR (`module-registry` + `ui-copy.ts`) |

### Phase 2 — Veille IA (UX cible + nettoyage)

| PR | Contenu |
|----|---------|
| 2.1 | Affinage `VeilleWorkspace` forum-like (sans toucher schema ingest) |
| 2.2 | Renommer fichiers `veille-workspace.tsx`, tests tri severities |
| 2.3 | Supprimer UI morte `feed-*`, `item-detail-modal`, legacy queries non utilisées |
| 2.4 | Désactiver cron + workflow `ai-intel-ingest` si prod = veille externe only |
| 2.5 | Migration drop tables `ai_intel_*` (après backup confirmé) |

### Phase 3 — Snippets

| PR | Contenu |
|----|---------|
| 3.1 | Découpe `snippets-workspace` → `SnippetsSidebar`, `SnippetList`, `SnippetEditorSheet` |
| 3.2 | UX copy + tags + recherche (local first) |
| 3.3 | (Option) Supabase Storage images + migration données |

### Phase 4 — CV Builder

| PR | Contenu |
|----|---------|
| 4.1 | Stepper + split preview DS |
| 4.2 | Templates print (3 variants) + PDF polish `export.ts` |
| 4.3 | Route dédiée `/app/cv` (redirect career) — optionnel |

### Phase 5 — Catalogue outils & Dépenses

| PR | Contenu |
|----|---------|
| 5.1 | Refonte `tools-directory.tsx` cards + fiche |
| 5.2 | Harmoniser onglets expenses avec DS |

### Phase 6 — Overview & landing

| PR | Contenu |
|----|---------|
| 6.1 | `TodayBoard` aligné nouvelle veille |
| 6.2 | Landing `app/page.tsx` cohérence brand refonte |

### Phase 7 — Supabase neuf & docs

| PR | Contenu |
|----|---------|
| 7.1 | Squash migrations ou baseline unique pour nouveaux envs |
| 7.2 | `DEPLOY.md` / README alignés secrets veille + billing |

---

## Annexes

### A. Contrat ingest veille (à ne pas casser)

- **Route :** `POST /api/veille/ingest`
- **Auth :** header `x-ingest-secret` = `VEILLE_INGEST_SECRET`
- **Body :** objet ou `{ items: [...] }` validé par `parseVeilleIngestBody` (`veille/ingest-schema.ts`)
- **Réponses :** 401 unauthorized, 400 validation Zod flatten, 200 `{ ok: true, ...counts }`

### B. Commandes utiles

```bash
npm run dev          # Turbopack
npm run build        # typecheck + build
npm run lint         # layering ESLint
npm test             # vitest
npm audit            # sécurité deps
```

### C. Références repo

- Architecture agent : `AGENTS.md`
- Design system : `src/design-system/README.md`, `src/assets/styles/README.md`
- Deploy : `DEPLOY.md`, `.env.example`

---

*Document produit par audit statique du dépôt — valider les hypothèses multi-tenant et billing prod avec le owner avant exécution phase 0.*
