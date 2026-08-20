-- Drop each user's collected offers after 30 days, independently of the
-- shared job_listings row (another user may have re-scraped it).

create index if not exists job_user_listings_scraped_at_idx
  on public.job_user_listings (scraped_at);
