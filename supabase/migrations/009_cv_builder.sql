-- CV Builder: one document per user (developer CV)

create table if not exists public.cv_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  title text not null default 'Mon CV',
  theme_id text not null default 'modern'
    check (theme_id in ('minimal', 'modern', 'classic', 'tech')),
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cv_documents_user_idx on public.cv_documents (user_id);

drop trigger if exists cv_documents_updated_at on public.cv_documents;
create trigger cv_documents_updated_at
  before update on public.cv_documents
  for each row execute function public.set_updated_at();

alter table public.cv_documents enable row level security;

drop policy if exists cv_documents_select_own on public.cv_documents;
create policy cv_documents_select_own on public.cv_documents
  for select using (auth.uid() = user_id);

drop policy if exists cv_documents_insert_own on public.cv_documents;
create policy cv_documents_insert_own on public.cv_documents
  for insert with check (auth.uid() = user_id);

drop policy if exists cv_documents_update_own on public.cv_documents;
create policy cv_documents_update_own on public.cv_documents
  for update using (auth.uid() = user_id);

drop policy if exists cv_documents_delete_own on public.cv_documents;
create policy cv_documents_delete_own on public.cv_documents
  for delete using (auth.uid() = user_id);
