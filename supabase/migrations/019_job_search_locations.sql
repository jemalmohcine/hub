-- Multi-select cities / countries for the daily job scrape.

alter table public.job_search_prefs
  add column if not exists locations text[] not null default '{}';

update public.job_search_prefs
set locations = array[btrim(city)]
where coalesce(cardinality(locations), 0) = 0
  and btrim(coalesce(city, '')) <> '';

alter table public.job_search_prefs
  drop constraint if exists job_search_prefs_locations_count;

alter table public.job_search_prefs
  add constraint job_search_prefs_locations_count
  check (cardinality(locations) <= 12);
