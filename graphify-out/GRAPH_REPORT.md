# Graph Report - hub  (2026-07-26)

## Corpus Check
- 104 files · ~21,989 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 517 nodes · 1205 edges · 25 communities (21 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7fb09ef3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Design System UI Kit|Design System UI Kit]]
- [[_COMMUNITY_App Settings Routes|App Settings Routes]]
- [[_COMMUNITY_DS Layout Components|DS Layout Components]]
- [[_COMMUNITY_Landing Page UI|Landing Page UI]]
- [[_COMMUNITY_Docs Deploy Stack|Docs Deploy Stack]]
- [[_COMMUNITY_NPM Dependencies|NPM Dependencies]]
- [[_COMMUNITY_shadcn Components Config|shadcn Components Config]]
- [[_COMMUNITY_Auth Server Actions|Auth Server Actions]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Billing Providers|Billing Providers]]
- [[_COMMUNITY_Auth Middleware Proxy|Auth Middleware Proxy]]
- [[_COMMUNITY_Vercel Config|Vercel Config]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next Config|Next Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_PWA Service Worker|PWA Service Worker]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 83 edges
2. `getHubUser` - 32 edges
3. `createClient()` - 23 edges
4. `Card()` - 18 edges
5. `Text()` - 17 edges
6. `compilerOptions` - 16 edges
7. `Stack()` - 14 edges
8. `Badge()` - 11 edges
9. `Cluster()` - 11 edges
10. `PageHeader()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Design system product API` --semantically_similar_to--> `Product API @/design-system`  [INFERRED] [semantically similar]
  README.md → src/design-system/README.md
- `Vercel deployment` --semantically_similar_to--> `Vercel and PWA hosting`  [INFERRED] [semantically similar]
  DEPLOY.md → README.md
- `shadcn/ui` --semantically_similar_to--> `shadcn UI primitives path`  [INFERRED] [semantically similar]
  README.md → src/design-system/README.md
- `Vercel environment variables` --shares_data_with--> `Supabase Auth Postgres RLS`  [INFERRED]
  DEPLOY.md → README.md
- `AppLayout()` --calls--> `getHubUser`  [INFERRED]
  src/app/(app)/layout.tsx → src/core/auth/get-user.ts

## Import Cycles
- None detected.

## Communities (25 total, 4 thin omitted)

### Community 0 - "Design System UI Kit"
Cohesion: 0.05
Nodes (54): ibmPlexMono, metadata, RootLayout(), sora, viewport, CardHeader(), CardVariant, variants (+46 more)

### Community 1 - "App Settings Routes"
Cohesion: 0.08
Nodes (29): AccountSettingsPage(), metadata, AdminLayout(), AdminPage(), toggleAiIntelSave(), AppLayout(), getSessionUser(), requireAdmin() (+21 more)

### Community 2 - "DS Layout Components"
Cohesion: 0.06
Nodes (47): AppearanceSettingsPage(), metadata, ActionResult, appUrl(), changePassword(), composeDisplayName(), mockUpgradePlan(), requestPasswordReset() (+39 more)

### Community 3 - "Landing Page UI"
Cohesion: 0.07
Nodes (59): metadata, PILLAR_LABELS, URGENCY_LABELS, metadata, PILLARS, STEPS, metadata, ButtonSize (+51 more)

### Community 4 - "Docs Deploy Stack"
Cohesion: 0.20
Nodes (13): Vercel environment variables, jemalmohcine/hub GitHub repo, SQL migrations apply order, Supabase Auth URL configuration, Vercel deployment, Admin role via profiles, Supabase Auth Postgres RLS, Vercel and PWA hosting (+5 more)

### Community 5 - "NPM Dependencies"
Cohesion: 0.06
Nodes (32): dependencies, cheerio, class-variance-authority, clsx, lucide-react, next, next-themes, radix-ui (+24 more)

### Community 6 - "shadcn Components Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 7 - "Auth Server Actions"
Cohesion: 0.07
Nodes (55): classifyHit(), runAiIntelIngest(), FeedFilterParams, getAiIntelFeed(), getLatestAiIntelRun(), parseFeedFilters(), authorized(), GET() (+47 more)

### Community 8 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 9 - "Billing Providers"
Cohesion: 0.24
Nodes (9): PlanId, getPaymentProvider(), MockPaymentProvider, BillingSettingsPage(), CheckoutResult, PaymentProvider, PortalResult, POST() (+1 more)

### Community 10 - "Auth Middleware Proxy"
Cohesion: 0.60
Nodes (3): config, proxy(), updateSession()

### Community 11 - "Vercel Config"
Cohesion: 0.50
Nodes (3): crons, framework, $schema

### Community 17 - "Community 17"
Cohesion: 0.24
Nodes (8): Button(), sizeMap, variantMap, FormSubmit(), ThemeProvider(), ThemeSync(), Button(), buttonVariants

### Community 18 - "Community 18"
Cohesion: 0.22
Nodes (9): Admin, Billing, DevHub — Phase 1 Hub Global, Déploiement Vercel, Phase 2 — AI Intelligence, Scripts, Setup local, Stack (+1 more)

### Community 19 - "Community 19"
Cohesion: 0.36
Nodes (7): Design tokens in src/assets/styles, Tailwind CSS 4.3.3, Design tokens (Tailwind CSS v4), src/app/globals.css entry, CSS primitive tokens, CSS semantic tokens, @theme inline theme.css

### Community 20 - "Community 20"
Cohesion: 0.33
Nodes (6): cn utility @/lib/utils, Design system three layers, Product API @/design-system, shadcn UI primitives path, shadcn/ui, Token layering primitives semantic theme

### Community 21 - "Community 21"
Cohesion: 0.43
Nodes (6): Design system product API, DevHub Phase 1 Hub Global, MockPaymentProvider, PaymentProvider interface, Phase 2 AI Intelligence module, src app core shared structure

### Community 22 - "Community 22"
Cohesion: 0.33
Nodes (6): 1. Importer le projet, 2. Variables d'environnement, 3. Supabase Auth redirects, 4. SQL, CLI (optionnel), Déploiement Vercel (lié au repo GitHub)

### Community 23 - "Community 23"
Cohesion: 0.40
Nodes (3): Next.js breaking changes notice, This is NOT the Next.js you know, Next.js App Router

### Community 24 - "Community 24"
Cohesion: 0.40
Nodes (5): Couches, Design System DevHub, Import (pages), Stack, Tokens

## Knowledge Gaps
- **150 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+145 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Design System UI Kit` to `Community 17`, `DS Layout Components`, `Landing Page UI`, `App Settings Routes`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `Card()` connect `Landing Page UI` to `Design System UI Kit`, `App Settings Routes`, `DS Layout Components`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `getHubUser` connect `DS Layout Components` to `App Settings Routes`, `Landing Page UI`, `Billing Providers`, `Auth Server Actions`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _151 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Design System UI Kit` be split into smaller, more focused modules?**
  _Cohesion score 0.05028305028305028 - nodes in this community are weakly interconnected._
- **Should `App Settings Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._
- **Should `DS Layout Components` be split into smaller, more focused modules?**
  _Cohesion score 0.06013986013986014 - nodes in this community are weakly interconnected._