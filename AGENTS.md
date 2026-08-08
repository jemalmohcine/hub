<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# DevHub architecture

## Layers

Imports flow downwards only. The ESLint config enforces the two boundaries that
were being broken in practice.

```
assets/styles     design tokens (--text-*, --dh-*), Tailwind v4 @theme
components/ui     shadcn primitives — design-system is the only allowed consumer
design-system     the product component API (Card, Dialog, Sheet, EmptyState, …)
lib               pure, framework-free helpers (dates, text, slug, numbers, http, scrape)
core              auth, entitlements, i18n, module registry — the app's contracts
modules           one folder per feature: queries.ts, actions.ts, ui/
shared/ui         cross-module composites (app shell, navigation, ModulePage)
app               routing only; pages fetch and delegate
```

`src/modules/*` must not import from another module's `ui/`. Sharing UI means
promoting it to `design-system` or `shared/ui`.

## Rules that keep it centralised

- **Dates, numbers, text, slugs**: always `@/lib/*`. No `toLocaleDateString`,
  no ad-hoc `slice(0, 240)`, no local `formatStars`.
- **Outbound HTTP**: `@/lib/http/fetch-text`. It owns the user agent, the
  timeouts (`HTTP_TIMEOUTS`), and XML entity decoding.
- **HTML scraping**: `@/lib/scrape/page` (`readOpenGraph`, `extractMainText`).
- **Entitlements**: gate on `ENTITLEMENTS.*` keys, never raw strings.
  Server actions use `assertEntitled(key)`; pages use `ModulePage`.
- **Page shell**: every module page is `requirePageUser()` + `<ModulePage>`.
  The header, the description, and the Pro upsell come from the module registry,
  so adding a module means editing `core/module-registry` — not five files.
- **Empty states**: `<EmptyState>` only. Use `dense` in narrow columns.
- **Modals**: `<Dialog>` for forms, `<Sheet>` for the bottom-sheet pattern.
  Never import Radix or `@/components/ui` outside `design-system`.
- **Font sizes**: `text-[length:var(--dh-text-*)]`, never `text-[11px]`.

## AI intel pipeline

`collect → merge → rank → enrich (scrape + LLM) → filter → insert`.

- **Sources** live in `ai_intel_sources`. Only add one whose URL you have
  actually fetched — five seeded feeds were silently 404ing for months.
  Priority reflects how often the source produces something actionable:
  status pages and vendor changelogs first, practitioners next, press last.
  Aggregators (Hacker News, TLDR, GitHub Trending) must carry a traction
  filter in their query, otherwise they flood the feed.
- **Scraping and LLM calls are budgeted.** `preEnrichPriority` decides who
  spends the budget, so never reorder that step away.
- **One sentence, one place.** `purpose`, `essentialPoints[0]` and the head of
  `about` legitimately overlap in storage; `buildItemDetail` is what decides
  what reaches the screen. Render from it, never from raw metadata.
- **Nothing user-facing is truncated with a hard `slice`.** Use
  `truncateAtWord`, and give long prose a "read more" instead of an ellipsis.
- `productOf` names the vendor an item is *about*. An aggregator is never
  a product.

## Dev expenses advisor

`saisie → détection provider → diagnostic ligne → revue du budget entier`.

- **Every LLM feature resolves its model in `lib/ai/model.ts`.** One env var
  switches the whole app between the free Gemini tier and the AI Gateway.
- **The advisor is optional, never load-bearing.** `llm-advisor.ts` returns
  `null` on a missing key, a throttle, or a bad payload, and `diagnose.ts`
  answers instead. Every diagnostic carries `source: "ai" | "catalog"` and the
  UI says which one the user is reading.
- **`catalog.ts` is data, not logic**: providers, aliases, free tiers, and the
  alternatives worth suggesting. Add a provider there rather than teaching the
  prompt about it.
- **The budget review reads the whole stack in one call.** Duplicates and
  overlapping tools are invisible service by service, which is exactly where
  the money is.

## Dev tools catalogue

`seeds + découverte GitHub → métriques dépôt → scrape des tarifs → classification LLM → upsert`.

Runs daily in `.github/workflows/dev-tools-ingest.yml`, writes `public.dev_tools`
(shared table, authenticated read, service-role write), and feeds both the
`/app/expenses?tab=tools` directory and the expense advisor's alternatives.

- **Measured facts and editorial judgement stay separate.** Stars, licence and
  release dates come from the GitHub API every night because they are cheap;
  the tagline, free-tier wording and pros/cons cost an LLM call, so a row is
  only re-classified once its `scraped_at` is older than `DEV_TOOLS_REFRESH_DAYS`.
  `data_source` records which layer a row actually got.
- **Scores are pure functions in `scoring.ts`.** Same repo, same score every
  night, so a ranking change always means something moved. Popularity is a log
  scale on stars; stability blends age, commit recency, release cadence and
  licence, and is zero for an archived project.
- **A free trial is not a free tier.** `pricing.ts` refuses the shortcut, and
  the prompt repeats the rule — a wrong "c'est gratuit" is worse than "je ne
  sais pas".
- **Hosted products have no repo to measure.** They carry an editorial baseline
  in `seeds.ts` that the model can refine, never a fabricated star count.
- **The advisor consumes the catalogue, not a hardcoded list.**
  `findAlternativeTools()` grounds both the offline diagnostic and the prompt in
  the same scraped rows; `catalog.ts` is only the fallback before the first run.

## Commands

```bash
npm run dev         # Turbopack dev server
npm run build       # production build (also typechecks)
npm run typecheck   # tsc --noEmit
npm run lint        # eslint, includes the layering rule
npm test            # vitest, unit tests on lib/ and core/
```

## Conventions

- Server components fetch; client components (`"use client"`) hold state only.
- Server actions live in `modules/<name>/actions.ts` and always start with the
  entitlement guard.
- Queries live in `modules/<name>/queries.ts` and return plain, serialisable data.
- User-facing copy is French. Shared strings live in `core/i18n/ui-copy.ts`;
  feature copy stays in its module.
