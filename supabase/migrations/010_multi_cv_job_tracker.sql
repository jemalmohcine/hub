-- Multi-CV support + Job Tracker

alter table public.cv_documents drop constraint if exists cv_documents_user_id_key;

alter table public.cv_documents
  add column if not exists target_job_title text,
  add column if not exists job_description_snippet text,
  add column if not exists is_tailored boolean not null default false;

create index if not exists cv_documents_user_updated_idx
  on public.cv_documents (user_id, updated_at desc);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  company text not null,
  role text not null,
  status text not null default 'to_apply'
    check (status in ('to_apply', 'applied', 'interview', 'offer', 'rejected')),
  job_url text,
  notes text,
  cv_document_id uuid references public.cv_documents (id) on delete set null,
  applied_at date,
  follow_up_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_applications_user_status_idx
  on public.job_applications (user_id, status);

create index if not exists job_applications_user_updated_idx
  on public.job_applications (user_id, updated_at desc);

drop trigger if exists job_applications_updated_at on public.job_applications;
create trigger job_applications_updated_at
  before update on public.job_applications
  for each row execute function public.set_updated_at();

alter table public.job_applications enable row level security;

drop policy if exists job_applications_select_own on public.job_applications;
create policy job_applications_select_own on public.job_applications
  for select using (auth.uid() = user_id);

drop policy if exists job_applications_insert_own on public.job_applications;
create policy job_applications_insert_own on public.job_applications
  for insert with check (auth.uid() = user_id);

drop policy if exists job_applications_update_own on public.job_applications;
create policy job_applications_update_own on public.job_applications
  for update using (auth.uid() = user_id);

drop policy if exists job_applications_delete_own on public.job_applications;
create policy job_applications_delete_own on public.job_applications
  for delete using (auth.uid() = user_id);
