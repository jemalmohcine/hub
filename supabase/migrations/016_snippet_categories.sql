-- User-created snippet categories (not AI). One category per snippet.

create table if not exists public.dev_snippet_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint dev_snippet_categories_name_len check (char_length(trim(name)) between 1 and 40)
);

create unique index if not exists dev_snippet_categories_user_name_idx
  on public.dev_snippet_categories (user_id, lower(trim(name)));

create index if not exists dev_snippet_categories_user_idx
  on public.dev_snippet_categories (user_id, created_at);

alter table public.dev_snippet_categories enable row level security;

drop policy if exists dev_snippet_categories_select_own on public.dev_snippet_categories;
create policy dev_snippet_categories_select_own on public.dev_snippet_categories
  for select using (auth.uid() = user_id);

drop policy if exists dev_snippet_categories_insert_own on public.dev_snippet_categories;
create policy dev_snippet_categories_insert_own on public.dev_snippet_categories
  for insert with check (auth.uid() = user_id);

drop policy if exists dev_snippet_categories_update_own on public.dev_snippet_categories;
create policy dev_snippet_categories_update_own on public.dev_snippet_categories
  for update using (auth.uid() = user_id);

drop policy if exists dev_snippet_categories_delete_own on public.dev_snippet_categories;
create policy dev_snippet_categories_delete_own on public.dev_snippet_categories
  for delete using (auth.uid() = user_id);

alter table public.dev_snippets
  add column if not exists category_id uuid
  references public.dev_snippet_categories (id) on delete set null;

create index if not exists dev_snippets_user_category_idx
  on public.dev_snippets (user_id, category_id);
