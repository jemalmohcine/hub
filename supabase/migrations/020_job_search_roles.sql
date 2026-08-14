-- Roles multi-select + wider city/role text so save no longer hits the 80-char checks.

alter table public.job_search_prefs
  add column if not exists roles text[] not null default '{}';

update public.job_search_prefs
set roles = array[btrim(role_query)]
where coalesce(cardinality(roles), 0) = 0
  and btrim(coalesce(role_query, '')) <> '';

alter table public.job_search_prefs
  drop constraint if exists job_search_prefs_role_len;

alter table public.job_search_prefs
  add constraint job_search_prefs_role_len
  check (char_length(role_query) <= 240);

alter table public.job_search_prefs
  drop constraint if exists job_search_prefs_city_len;

alter table public.job_search_prefs
  add constraint job_search_prefs_city_len
  check (char_length(city) <= 400);

alter table public.job_search_prefs
  drop constraint if exists job_search_prefs_roles_count;

alter table public.job_search_prefs
  add constraint job_search_prefs_roles_count
  check (cardinality(roles) <= 12);
