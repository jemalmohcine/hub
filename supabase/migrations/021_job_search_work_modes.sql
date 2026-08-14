-- Multi-select work modes (télétravail + présentiel at once).

alter table public.job_search_prefs
  add column if not exists work_modes text[] not null default '{}';

update public.job_search_prefs
set work_modes = array[work_mode]
where coalesce(cardinality(work_modes), 0) = 0
  and work_mode in ('remote', 'hybrid', 'onsite');

alter table public.job_search_prefs
  drop constraint if exists job_search_prefs_work_modes_count;

alter table public.job_search_prefs
  add constraint job_search_prefs_work_modes_count
  check (cardinality(work_modes) <= 3);

alter table public.job_search_prefs
  drop constraint if exists job_search_prefs_work_modes_values;

alter table public.job_search_prefs
  add constraint job_search_prefs_work_modes_values
  check (work_modes <@ array['remote', 'hybrid', 'onsite']::text[]);
