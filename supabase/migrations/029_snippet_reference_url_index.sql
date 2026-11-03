-- Index for duplicate detection when saving veille links as snippets (reference_url already exists on dev_snippets).

create index if not exists dev_snippets_user_reference_url_idx
  on public.dev_snippets (user_id, reference_url)
  where reference_url is not null;
