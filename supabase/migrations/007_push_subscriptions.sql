-- Web Push subscriptions for installed PWA clients
create table if not exists public.hub_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (endpoint)
);

create index if not exists hub_push_subscriptions_user_idx
  on public.hub_push_subscriptions (user_id);

alter table public.hub_push_subscriptions enable row level security;

drop policy if exists "Users manage own push subscriptions" on public.hub_push_subscriptions;
create policy "Users manage own push subscriptions"
  on public.hub_push_subscriptions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
