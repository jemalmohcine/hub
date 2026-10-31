-- Veille IA: daily feed ingested by external agent (Info Ai) via POST /api/veille/ingest

create table if not exists public.veille_ia_items (
  id uuid primary key default gen_random_uuid(),
  feed_date date not null,
  category text not null check (
    category in (
      'securite',
      'versions',
      'modeles-prix',
      'outils-agents',
      'repos-github'
    )
  ),
  provider text not null check (
    provider in (
      'anthropic',
      'openai',
      'google-gemini',
      'xai-grok',
      'vercel',
      'cursor',
      'github',
      'nuxt-vue',
      'laravel-php',
      'node-npm',
      'other'
    )
  ),
  severity text not null check (
    severity in ('critique', 'elevee', 'moyenne', 'info')
  ),
  title text not null,
  summary text not null,
  quoi text not null default '',
  impact text not null default '',
  link text not null,
  affected_versions text[] not null default '{}',
  fixed_versions text[] not null default '{}',
  stars_week integer,
  stars_month integer,
  price_info text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint veille_ia_items_link_title_key unique (link, title)
);

create index if not exists veille_ia_items_feed_date_idx
  on public.veille_ia_items (feed_date desc);

create index if not exists veille_ia_items_category_idx
  on public.veille_ia_items (category);

create index if not exists veille_ia_items_provider_idx
  on public.veille_ia_items (provider);

create index if not exists veille_ia_items_severity_idx
  on public.veille_ia_items (severity);

drop trigger if exists veille_ia_items_updated_at on public.veille_ia_items;
create trigger veille_ia_items_updated_at
  before update on public.veille_ia_items
  for each row execute function public.set_updated_at();

create table if not exists public.veille_ia_saves (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid not null references public.veille_ia_items (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create index if not exists veille_ia_saves_user_idx
  on public.veille_ia_saves (user_id, created_at desc);

alter table public.veille_ia_items enable row level security;
alter table public.veille_ia_saves enable row level security;

drop policy if exists "Authenticated read veille items" on public.veille_ia_items;
create policy "Authenticated read veille items"
  on public.veille_ia_items for select
  to authenticated
  using (true);

drop policy if exists "Users manage own veille saves" on public.veille_ia_saves;
create policy "Users manage own veille saves"
  on public.veille_ia_saves for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Dev-only examples (tag: exemple-dev). Safe to delete in production.
insert into public.veille_ia_items (
  feed_date, category, provider, severity, title, summary, quoi, impact, link,
  affected_versions, fixed_versions, stars_week, stars_month, price_info, tags
) values
  (
    '2026-10-31',
    'securite',
    'laravel-php',
    'critique',
    '[EXEMPLE DEV] Faille RCE Laravel en prod',
    'Correctif urgent sur une exécution distante via routes debug mal verrouillées.',
    E'• CVE critique sur le routeur en mode debug\n• Exploitation active observée',
    E'• Vérifie APP_DEBUG=false sur tes apps Laravel\n• Applique le patch dès ce soir',
    'https://example.com/dev/laravel-rce-exemple',
    array['11.x', '10.x'],
    array['11.46.1', '10.48.29'],
    null,
    null,
    null,
    array['exemple-dev', 'laravel']
  ),
  (
    '2026-10-31',
    'versions',
    'node-npm',
    'elevee',
    '[EXEMPLE DEV] Node 22 LTS — fin de support imminente',
    'Planifie la montée de version avant la coupure des correctifs de sécurité.',
    E'• Node 22 entre en maintenance réduite\n• Node 24 devient la cible recommandée',
    E'• Aligne CI et Docker sur la LTS active\n• Teste npm audit après upgrade',
    'https://example.com/dev/node-lts-exemple',
    array['22.x'],
    array['24.x'],
    null,
    null,
    null,
    array['exemple-dev', 'node']
  ),
  (
    '2026-10-31',
    'modeles-prix',
    'openai',
    'elevee',
    '[EXEMPLE DEV] GPT-4o mini — baisse des tokens sortants',
    'Les sorties longues coûtent moins cher ; les entrées image inchangées.',
    E'• Tarif sortie -40 % sur 4o mini\n• Pas de changement sur les embeddings',
    E'• Revois les budgets des agents qui stream beaucoup de texte',
    'https://example.com/dev/openai-pricing-exemple',
    array[]::text[],
    array[]::text[],
    null,
    null,
    'Sortie: 0,60 $ / M tokens (exemple)',
    array['exemple-dev', 'pricing']
  ),
  (
    '2026-10-31',
    'modeles-prix',
    'anthropic',
    'moyenne',
    '[EXEMPLE DEV] Claude Sonnet — fenêtre 200k stable',
    'Pas de hausse annoncée ; le tier gratuit reste limité aux tests.',
    E'• Contexte 200k confirmé sur l’API\n• Pas de nouveau modèle ce matin',
    E'• Utile si tu chunkais par habitude — tu peux simplifier',
    'https://example.com/dev/anthropic-sonnet-exemple',
    array[]::text[],
    array[]::text[],
    null,
    null,
    null,
    array['exemple-dev']
  ),
  (
    '2026-10-31',
    'outils-agents',
    'cursor',
    'info',
    '[EXEMPLE DEV] Cursor — règles projet partagées',
    'Les règles `.cursor/rules` se synchronisent mieux entre membres d’équipe.',
    E'• Sync bidirectionnelle des rules\n• Moins de conflits sur les gros monorepos',
    E'• Standardise AGENTS.md + rules pour ton stack Vue/Laravel',
    'https://example.com/dev/cursor-rules-exemple',
    array[]::text[],
    array[]::text[],
    null,
    null,
    null,
    array['exemple-dev', 'cursor']
  ),
  (
    '2026-10-31',
    'outils-agents',
    'vercel',
    'moyenne',
    '[EXEMPLE DEV] Vercel — builds plus rapides sur Next 16',
    'Cache Turbopack amélioré pour les gros monorepos frontend.',
    E'• CI preview ~15 % plus rapide (mesure interne)\n• Pas d’action requise',
    E'• Re-déploie une preview pour profiter du cache',
    'https://example.com/dev/vercel-build-exemple',
    array[]::text[],
    array[]::text[],
    null,
    null,
    null,
    array['exemple-dev', 'vercel']
  ),
  (
    '2026-10-31',
    'repos-github',
    'nuxt-vue',
    'info',
    '[EXEMPLE DEV] nuxt/nuxt — +2,1k ★ cette semaine',
    'Nuxt 4 docs et modules ecosystem en tête des tendances Vue.',
    E'• Pic d’étoiles sur le dépôt principal\n• Releases mineures cette semaine',
    E'• Garde un œil sur les modules auth que tu utilises',
    'https://github.com/nuxt/nuxt',
    array[]::text[],
    array[]::text[],
    2100,
    5400,
    null,
    array['exemple-dev', 'vue']
  ),
  (
    '2026-10-31',
    'repos-github',
    'github',
    'info',
    '[EXEMPLE DEV] copilot-cli — momentum GitHub',
    'CLI agentique en beta ; utile pour scripts de maintenance.',
    E'• +800 ★ en 7 jours\n• Intégration GH Actions annoncée',
    E'• À tester sur tâches batch non critiques',
    'https://github.com/github/copilot-cli',
    array[]::text[],
    array[]::text[],
    800,
    1200,
    null,
    array['exemple-dev']
  ),
  (
    '2026-10-30',
    'securite',
    'node-npm',
    'elevee',
    '[EXEMPLE DEV] npm — advisory sur une lib de parsing',
    'Prototype XSS dans une dépendance transitive très utilisée.',
    E'• Advisory GHSA-xxxx\n• Fix en 3.2.1',
    E'• Lance npm audit et mets à jour lockfile',
    'https://example.com/dev/npm-advisory-exemple',
    array['3.0.0', '3.1.0'],
    array['3.2.1'],
    null,
    null,
    null,
    array['exemple-dev', 'npm']
  ),
  (
    '2026-10-30',
    'versions',
    'nuxt-vue',
    'info',
    '[EXEMPLE DEV] Nuxt 4.2 — patch SSR',
    'Correction d’hydratation sur layouts imbriqués.',
    E'• Fix SSR layout\n• Pas de breaking change',
    E'• Upgrade conseillé si tu vois des mismatches',
    'https://example.com/dev/nuxt-patch-exemple',
    array['4.2.0'],
    array['4.2.1'],
    null,
    null,
    null,
    array['exemple-dev']
  )
on conflict (link, title) do nothing;
