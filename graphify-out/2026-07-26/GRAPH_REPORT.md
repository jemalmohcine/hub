# Graph Report - .  (2026-07-17)

## Corpus Check
- Corpus is ~16,379 words - fits in a single context window. You may not need a graph.

## Summary
- 413 nodes · 963 edges · 17 communities (12 shown, 5 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `cn()` - 81 edges
2. `getHubUser` - 30 edges
3. `createClient()` - 18 edges
4. `Card()` - 17 edges
5. `Text()` - 16 edges
6. `compilerOptions` - 16 edges
7. `README.md DevHub Phase 1` - 15 edges
8. `Stack()` - 13 edges
9. `PageHeader()` - 11 edges
10. `Badge()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Vercel deployment` --semantically_similar_to--> `Vercel and PWA hosting`  [INFERRED] [semantically similar]
  DEPLOY.md → README.md
- `shadcn/ui` --semantically_similar_to--> `shadcn UI primitives path`  [INFERRED] [semantically similar]
  README.md → src/design-system/README.md
- `Design system product API` --semantically_similar_to--> `Product API @/design-system`  [INFERRED] [semantically similar]
  README.md → src/design-system/README.md
- `Vercel environment variables` --shares_data_with--> `Supabase Auth Postgres RLS`  [INFERRED]
  DEPLOY.md → README.md
- `Design tokens in src/assets/styles` --conceptually_related_to--> `Design tokens README`  [INFERRED]
  README.md → src/assets/styles/README.md

## Import Cycles
- None detected.

## Communities (17 total, 5 thin omitted)

### Community 0 - "Design System UI Kit"
Cohesion: 0.05
Nodes (53): ibmPlexMono, metadata, RootLayout(), sora, viewport, CardVariant, variants, alertExtra (+45 more)

### Community 1 - "App Settings Routes"
Cohesion: 0.06
Nodes (57): AccountSettingsPage(), metadata, AdminLayout(), AiModulePage(), metadata, AppLayout(), AppearanceSettingsPage(), metadata (+49 more)

### Community 2 - "DS Layout Components"
Cohesion: 0.08
Nodes (37): Button(), Card(), CardHeader(), Alert(), FormSubmit(), Field(), Form(), Divider() (+29 more)

### Community 3 - "Landing Page UI"
Cohesion: 0.08
Nodes (31): PILLARS, STEPS, ButtonSize, ButtonVariant, sizeMap, variantMap, Cluster(), Container() (+23 more)

### Community 4 - "Docs Deploy Stack"
Cohesion: 0.08
Nodes (38): AGENTS.md Next.js agent rules, Next.js breaking changes notice, DEPLOY.md Vercel deployment guide, Vercel environment variables, jemalmohcine/hub GitHub repo, SQL migrations apply order, Supabase Auth URL configuration, Vercel deployment (+30 more)

### Community 5 - "NPM Dependencies"
Cohesion: 0.06
Nodes (31): dependencies, class-variance-authority, clsx, lucide-react, next, next-themes, radix-ui, react (+23 more)

### Community 6 - "shadcn Components Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 7 - "Auth Server Actions"
Cohesion: 0.19
Nodes (17): AdminPage(), metadata, ActionResult, appUrl(), changePassword(), composeDisplayName(), requestPasswordReset(), resetPassword() (+9 more)

### Community 8 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 9 - "Billing Providers"
Cohesion: 0.38
Nodes (5): PlanId, MockPaymentProvider, CheckoutResult, PaymentProvider, PortalResult

### Community 10 - "Auth Middleware Proxy"
Cohesion: 0.60
Nodes (3): config, proxy(), updateSession()

## Knowledge Gaps
- **120 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+115 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Design System UI Kit` to `App Settings Routes`, `DS Layout Components`, `Landing Page UI`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **Why does `getHubUser` connect `App Settings Routes` to `DS Layout Components`, `Auth Server Actions`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `Card()` connect `DS Layout Components` to `Design System UI Kit`, `App Settings Routes`, `Landing Page UI`, `Auth Server Actions`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _121 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Design System UI Kit` be split into smaller, more focused modules?**
  _Cohesion score 0.05094905094905095 - nodes in this community are weakly interconnected._
- **Should `App Settings Routes` be split into smaller, more focused modules?**
  _Cohesion score 0.06070175438596491 - nodes in this community are weakly interconnected._
- **Should `DS Layout Components` be split into smaller, more focused modules?**
  _Cohesion score 0.07878787878787878 - nodes in this community are weakly interconnected._