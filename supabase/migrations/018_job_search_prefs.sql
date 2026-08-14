-- User job-search prefs + work mode on listings (France-first, not worldwide).

alter table public.job_listings
  add column if not exists work_mode text
    check (work_mode is null or work_mode in ('remote', 'hybrid', 'onsite'));

create index if not exists job_listings_work_mode_idx
  on public.job_listings (work_mode);

create table if not exists public.job_search_prefs (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  role_query text not null default '',
  city text not null default '',
  work_mode text not null default 'hybrid'
    check (work_mode in ('remote', 'hybrid', 'onsite')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_search_prefs_role_len check (char_length(role_query) <= 80),
  constraint job_search_prefs_city_len check (char_length(city) <= 80)
);

drop trigger if exists job_search_prefs_updated_at on public.job_search_prefs;
create trigger job_search_prefs_updated_at
  before update on public.job_search_prefs
  for each row execute function public.set_updated_at();

alter table public.job_search_prefs enable row level security;

drop policy if exists job_search_prefs_select_own on public.job_search_prefs;
create policy job_search_prefs_select_own on public.job_search_prefs
  for select using (auth.uid() = user_id);

drop policy if exists job_search_prefs_upsert_own on public.job_search_prefs;
create policy job_search_prefs_upsert_own on public.job_search_prefs
  for insert with check (auth.uid() = user_id);

drop policy if exists job_search_prefs_update_own on public.job_search_prefs;
create policy job_search_prefs_update_own on public.job_search_prefs
  for update using (auth.uid() = user_id);
