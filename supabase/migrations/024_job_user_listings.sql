-- Each user keeps the offers collected for their saved search.
-- Filtering reads this set; a new search attaches freshly scraped rows.

create table if not exists public.job_user_listings (
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id uuid not null references public.job_listings (id) on delete cascade,
  scraped_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create index if not exists job_user_listings_user_scraped_idx
  on public.job_user_listings (user_id, scraped_at desc);

alter table public.job_user_listings enable row level security;

drop policy if exists job_user_listings_select_own on public.job_user_listings;
create policy job_user_listings_select_own on public.job_user_listings
  for select using (auth.uid() = user_id);
