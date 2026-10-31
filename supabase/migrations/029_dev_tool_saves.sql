-- User bookmarks / tracking for the free dev offers catalogue.
create table if not exists public.dev_tool_saves (
  user_id uuid not null references auth.users (id) on delete cascade,
  tool_id uuid not null references public.dev_tools (id) on delete cascade,
  notes text not null default '',
  created_at timestamptz not null default now(),
  primary key (user_id, tool_id)
);

create index if not exists dev_tool_saves_user_idx
  on public.dev_tool_saves (user_id, created_at desc);

alter table public.dev_tool_saves enable row level security;

drop policy if exists dev_tool_saves_select_own on public.dev_tool_saves;
create policy dev_tool_saves_select_own on public.dev_tool_saves
  for select using (auth.uid() = user_id);

drop policy if exists dev_tool_saves_insert_own on public.dev_tool_saves;
create policy dev_tool_saves_insert_own on public.dev_tool_saves
  for insert with check (auth.uid() = user_id);

drop policy if exists dev_tool_saves_update_own on public.dev_tool_saves;
create policy dev_tool_saves_update_own on public.dev_tool_saves
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists dev_tool_saves_delete_own on public.dev_tool_saves;
create policy dev_tool_saves_delete_own on public.dev_tool_saves
  for delete using (auth.uid() = user_id);
