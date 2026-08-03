-- Scraped job offers + application categories (salarié / freelance)

create table if not exists public.job_listings (
  id uuid primary key default gen_random_uuid(),
  canonical_key text not null unique,
  source text not null,
  external_id text,
  company text not null,
  title text not null,
  description text,
  url text not null,
  employment_category text not null
    check (employment_category in ('salaried', 'freelance')),
  freelance_subtype text
    check (freelance_subtype is null or freelance_subtype in ('part_time', 'full_time')),
  location text,
  salary_hint text,
  tags text[] not null default '{}',
  published_at timestamptz,
  scraped_at timestamptz not null default now(),
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_listings_category_idx
  on public.job_listings (employment_category, freelance_subtype);

create index if not exists job_listings_scraped_at_idx
  on public.job_listings (scraped_at desc);

create index if not exists job_listings_published_at_idx
  on public.job_listings (published_at desc nulls last);

drop trigger if exists job_listings_updated_at on public.job_listings;
create trigger job_listings_updated_at
  before update on public.job_listings
  for each row execute function public.set_updated_at();

alter table public.job_listings enable row level security;

drop policy if exists job_listings_read_authenticated on public.job_listings;
create policy job_listings_read_authenticated on public.job_listings
  for select to authenticated using (true);

alter table public.job_applications
  add column if not exists employment_category text
    check (employment_category is null or employment_category in ('salaried', 'freelance')),
  add column if not exists freelance_subtype text
    check (freelance_subtype is null or freelance_subtype in ('part_time', 'full_time')),
  add column if not exists listing_id uuid references public.job_listings (id) on delete set null,
  add column if not exists description text,
  add column if not exists location text,
  add column if not exists salary_hint text;

create index if not exists job_applications_listing_idx
  on public.job_applications (user_id, listing_id);
