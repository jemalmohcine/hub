-- AI Intelligence Phase 2: sources registry, feed items, saves, run logs

-- Dynamic source registry (seeded + discovered nightly)
create table if not exists public.ai_intel_sources (
  id text primary key,
  name text not null,
  url text not null,
  kind text not null check (kind in ('rss', 'html', 'api')),
  pillar_hints text[] not null default '{}',
  priority integer not null default 50,
  enabled boolean not null default true,
  status text not null default 'active'
    check (status in ('active', 'candidate', 'disabled')),
  quality_score numeric(4, 2) not null default 0,
  last_ok_at timestamptz,
  last_error text,
  discovered_at timestamptz,
  discovery_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Canonical feed items (1 info = 1 row across sites)
create table if not exists public.ai_intel_items (
  id uuid primary key default gen_random_uuid(),
  canonical_key text not null unique,
  pillar text not null check (pillar in ('models', 'tools', 'opensource', 'world')),
  category text not null,
  urgency text not null check (urgency in ('urgent', 'medium', 'light')),
  title text not null,
  summary text not null default '',
  url text not null,
  primary_source text not null references public.ai_intel_sources (id),
  source_refs jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  ingested_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_intel_items_pillar_idx on public.ai_intel_items (pillar);
create index if not exists ai_intel_items_urgency_idx on public.ai_intel_items (urgency);
create index if not exists ai_intel_items_ingested_at_idx on public.ai_intel_items (ingested_at desc);
create index if not exists ai_intel_items_published_at_idx on public.ai_intel_items (published_at desc nulls last);
create index if not exists ai_intel_items_category_idx on public.ai_intel_items (category);

-- User bookmarks / saves
create table if not exists public.ai_intel_saves (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id uuid not null references public.ai_intel_items (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create index if not exists ai_intel_saves_user_idx on public.ai_intel_saves (user_id, created_at desc);

-- Nightly run logs
create table if not exists public.ai_intel_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running', 'success', 'partial', 'failed')),
  discovery jsonb not null default '{}'::jsonb,
  source_stats jsonb not null default '{}'::jsonb,
  merge_stats jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now()
);

drop trigger if exists ai_intel_sources_updated_at on public.ai_intel_sources;
create trigger ai_intel_sources_updated_at
  before update on public.ai_intel_sources
  for each row execute function public.set_updated_at();

drop trigger if exists ai_intel_items_updated_at on public.ai_intel_items;
create trigger ai_intel_items_updated_at
  before update on public.ai_intel_items
  for each row execute function public.set_updated_at();

-- Seed catalog (idempotent)
insert into public.ai_intel_sources (id, name, url, kind, pillar_hints, priority, status, quality_score) values
  ('gittrend', 'GitTrend', 'https://gittrend.io/', 'html', array['opensource'], 90, 'active', 9.0),
  ('futuretools', 'Future Tools', 'https://futuretools.io/', 'html', array['models','tools'], 95, 'active', 9.5),
  ('github-trending', 'GitHub Trending', 'https://github.com/trending', 'html', array['opensource'], 70, 'active', 8.5),
  ('hn-ai', 'Hacker News AI', 'https://hn.algolia.com/api/v1/search_by_date?query=AI%20OR%20LLM%20OR%20GPT&tags=story', 'api', array['models','tools','opensource'], 60, 'active', 8.0),
  ('openai-blog', 'OpenAI Blog', 'https://openai.com/blog/rss.xml', 'rss', array['models'], 85, 'active', 9.0),
  ('anthropic-news', 'Anthropic News', 'https://www.anthropic.com/news/rss.xml', 'rss', array['models'], 85, 'active', 9.0),
  ('google-ai-blog', 'Google AI Blog', 'https://blog.google/technology/ai/rss/', 'rss', array['models'], 80, 'active', 8.5),
  ('meta-ai-blog', 'Meta AI Blog', 'https://ai.meta.com/blog/rss/', 'rss', array['models'], 75, 'active', 8.0),
  ('huggingface-blog', 'Hugging Face Blog', 'https://huggingface.co/blog/feed.xml', 'rss', array['models','opensource'], 80, 'active', 8.5),
  ('vercel-blog', 'Vercel Blog', 'https://vercel.com/atom', 'rss', array['tools'], 70, 'active', 7.5),
  ('github-blog', 'GitHub Blog', 'https://github.blog/feed/', 'rss', array['tools','opensource'], 65, 'active', 7.5),
  ('tldr-ai', 'TLDR AI', 'https://tldr.tech/api/latest/ai', 'api', array['models','tools'], 85, 'active', 8.5),
  ('gnews-ai-policy', 'Google News AI Policy', 'https://news.google.com/rss/search?q=AI+regulation+OR+%22AI+Act%22+OR+%22ChatGPT+ban%22&hl=en-US&gl=US&ceid=US:en', 'rss', array['world'], 75, 'active', 8.0),
  ('gnews-ai-models', 'Google News AI Models', 'https://news.google.com/rss/search?q=%22new+AI+model%22+OR+%22LLM%22+pricing+OR+deprecat&hl=en-US&gl=US&ceid=US:en', 'rss', array['models'], 70, 'active', 7.5),
  ('producthunt-ai', 'Product Hunt AI', 'https://www.producthunt.com/topics/artificial-intelligence', 'html', array['tools'], 65, 'active', 7.0)
on conflict (id) do update set
  name = excluded.name,
  url = excluded.url,
  kind = excluded.kind,
  pillar_hints = excluded.pillar_hints,
  priority = excluded.priority,
  quality_score = excluded.quality_score,
  updated_at = now();

-- RLS
alter table public.ai_intel_sources enable row level security;
alter table public.ai_intel_items enable row level security;
alter table public.ai_intel_saves enable row level security;
alter table public.ai_intel_runs enable row level security;

-- Authenticated Pro users can read active sources & items.
-- Entitlement is enforced in the app layer; DB allows authenticated read of public intel.
drop policy if exists "Authenticated read ai sources" on public.ai_intel_sources;
create policy "Authenticated read ai sources"
  on public.ai_intel_sources for select
  to authenticated
  using (true);

drop policy if exists "Authenticated read ai items" on public.ai_intel_items;
create policy "Authenticated read ai items"
  on public.ai_intel_items for select
  to authenticated
  using (true);

drop policy if exists "Users manage own ai saves" on public.ai_intel_saves;
create policy "Users manage own ai saves"
  on public.ai_intel_saves for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Admins read ai runs" on public.ai_intel_runs;
create policy "Admins read ai runs"
  on public.ai_intel_runs for select
  to authenticated
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

-- Authenticated can see last run summary (finished only) for digest badge
drop policy if exists "Authenticated read finished ai runs" on public.ai_intel_runs;
create policy "Authenticated read finished ai runs"
  on public.ai_intel_runs for select
  to authenticated
  using (status in ('success', 'partial', 'failed') and finished_at is not null);
