-- Dev Snippets / Notes: personal code snippets and dev notes

create table if not exists public.dev_snippets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  kind text not null default 'snippet'
    check (kind in ('snippet', 'note')),
  language text,
  content text not null default '',
  tags text[] not null default '{}',
  reference_url text,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dev_snippets_user_pinned_idx
  on public.dev_snippets (user_id, is_pinned desc, updated_at desc);

create index if not exists dev_snippets_user_tags_idx
  on public.dev_snippets using gin (tags);

drop trigger if exists dev_snippets_updated_at on public.dev_snippets;
create trigger dev_snippets_updated_at
  before update on public.dev_snippets
  for each row execute function public.set_updated_at();

alter table public.dev_snippets enable row level security;

drop policy if exists dev_snippets_select_own on public.dev_snippets;
create policy dev_snippets_select_own on public.dev_snippets
  for select using (auth.uid() = user_id);

drop policy if exists dev_snippets_insert_own on public.dev_snippets;
create policy dev_snippets_insert_own on public.dev_snippets
  for insert with check (auth.uid() = user_id);

drop policy if exists dev_snippets_update_own on public.dev_snippets;
create policy dev_snippets_update_own on public.dev_snippets
  for update using (auth.uid() = user_id);

drop policy if exists dev_snippets_delete_own on public.dev_snippets;
create policy dev_snippets_delete_own on public.dev_snippets
  for delete using (auth.uid() = user_id);
