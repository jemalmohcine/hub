-- Dev stack expenses: services, monthly entries, provider tracking

create table if not exists public.dev_expense_services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  provider_slug text,
  category text not null default 'other'
    check (category in (
      'ai_api', 'hosting', 'database', 'auth', 'ci_cd',
      'monitoring', 'email', 'storage', 'saas', 'other'
    )),
  billing_cycle text not null default 'monthly'
    check (billing_cycle in ('monthly', 'yearly', 'usage')),
  planned_amount_cents integer not null default 0,
  currency text not null default 'EUR',
  website_url text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dev_expense_services_user_idx
  on public.dev_expense_services (user_id, is_active, updated_at desc);

create table if not exists public.dev_expense_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  service_id uuid not null references public.dev_expense_services (id) on delete cascade,
  month date not null,
  amount_cents integer not null,
  currency text not null default 'EUR',
  notes text,
  created_at timestamptz not null default now(),
  unique (service_id, month)
);

create index if not exists dev_expense_entries_user_month_idx
  on public.dev_expense_entries (user_id, month desc);

drop trigger if exists dev_expense_services_updated_at on public.dev_expense_services;
create trigger dev_expense_services_updated_at
  before update on public.dev_expense_services
  for each row execute function public.set_updated_at();

alter table public.dev_expense_services enable row level security;
alter table public.dev_expense_entries enable row level security;

drop policy if exists dev_expense_services_own on public.dev_expense_services;
create policy dev_expense_services_own on public.dev_expense_services
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists dev_expense_entries_own on public.dev_expense_entries;
create policy dev_expense_entries_own on public.dev_expense_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
