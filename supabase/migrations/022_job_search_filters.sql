-- Extra search filters (CV, years, keyword, seniority, recency, employment).
-- Existing role / city / work-mode columns stay the source of truth for those axes.

alter table public.job_search_prefs
  add column if not exists filters jsonb not null default '{}'::jsonb;

alter table public.job_search_prefs
  drop constraint if exists job_search_prefs_filters_object;

alter table public.job_search_prefs
  add constraint job_search_prefs_filters_object
  check (jsonb_typeof(filters) = 'object');
