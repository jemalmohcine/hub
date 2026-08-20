-- Remember when this user last collected offers, so we refresh at most once
-- per calendar day — and only when they open the app, not for everyone at dawn.

alter table public.job_search_prefs
  add column if not exists last_scraped_at timestamptz;
