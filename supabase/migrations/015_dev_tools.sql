-- Shared catalogue of dev tools, refreshed daily by scripts/dev-tools-ingest.ts.
-- Written by the service role, readable by every authenticated user: the rows
-- are public knowledge (stars, licence, pricing), not user data.

create table if not exists public.dev_tools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null default 'other'
    check (category in (
      'ai_api', 'hosting', 'database', 'auth', 'ci_cd',
      'monitoring', 'email', 'storage', 'saas', 'other'
    )),
  tagline text,
  summary text,
  website_url text,
  pricing_url text,
  docs_url text,
  repo_full_name text,

  -- Pricing, as read from the vendor's own pricing page
  pricing_model text not null default 'unknown'
    check (pricing_model in ('open_source', 'free', 'freemium', 'paid', 'usage', 'unknown')),
  has_free_tier boolean not null default false,
  free_tier_note text,
  starting_price_eur numeric(10, 2),

  -- Repository facts, when the tool has a public one
  license text,
  stars integer,
  forks integer,
  open_issues integer,
  repo_created_at timestamptz,
  last_commit_at timestamptz,
  last_release_at timestamptz,
  last_release_tag text,
  is_archived boolean not null default false,

  -- Derived, 0-100
  popularity_score smallint not null default 0,
  stability_score smallint not null default 0,
  overall_score smallint not null default 0,

  maturity text not null default 'unknown'
    check (maturity in ('emerging', 'growing', 'stable', 'mature', 'unknown')),
  audience text not null default 'any'
    check (audience in ('solo', 'pro', 'enterprise', 'any')),
  best_for text,
  pros text[] not null default '{}',
  cons text[] not null default '{}',
  tags text[] not null default '{}',
  alternative_slugs text[] not null default '{}',

  -- Provenance so the UI can say how much of a row is measured vs inferred
  data_source text not null default 'seed'
    check (data_source in ('seed', 'github', 'scrape', 'llm')),
  discovered_via text,
  raw jsonb not null default '{}'::jsonb,

  scraped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dev_tools_category_rank_idx
  on public.dev_tools (category, overall_score desc);

create index if not exists dev_tools_free_rank_idx
  on public.dev_tools (has_free_tier, overall_score desc);

create index if not exists dev_tools_scraped_at_idx
  on public.dev_tools (scraped_at desc nulls last);

drop trigger if exists dev_tools_updated_at on public.dev_tools;
create trigger dev_tools_updated_at
  before update on public.dev_tools
  for each row execute function public.set_updated_at();

alter table public.dev_tools enable row level security;

drop policy if exists dev_tools_read_authenticated on public.dev_tools;
create policy dev_tools_read_authenticated on public.dev_tools
  for select to authenticated using (true);
