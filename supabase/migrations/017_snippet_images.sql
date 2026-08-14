-- Optional image on a snippet (screenshot, diagram, pasted capture).
-- Stored as an https URL or a compressed data URL.

alter table public.dev_snippets
  add column if not exists image_url text;

alter table public.dev_snippets
  drop constraint if exists dev_snippets_image_url_len;

alter table public.dev_snippets
  add constraint dev_snippets_image_url_len
  check (image_url is null or char_length(image_url) between 1 and 750000);
