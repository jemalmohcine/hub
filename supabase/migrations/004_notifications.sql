-- Platform notifications (global + per-user reads)

create table if not exists public.hub_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  category text not null
    check (category in ('ai', 'billing', 'account', 'system')),
  title text not null,
  body text not null default '',
  href text,
  severity text not null default 'info'
    check (severity in ('info', 'success', 'warning', 'urgent')),
  dedupe_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists hub_notifications_dedupe_uidx
  on public.hub_notifications (dedupe_key)
  where dedupe_key is not null and user_id is null;

create unique index if not exists hub_notifications_dedupe_user_uidx
  on public.hub_notifications (user_id, dedupe_key)
  where dedupe_key is not null and user_id is not null;

create index if not exists hub_notifications_created_idx
  on public.hub_notifications (created_at desc);

create index if not exists hub_notifications_category_idx
  on public.hub_notifications (category);

create table if not exists public.hub_notification_reads (
  user_id uuid not null references public.profiles (id) on delete cascade,
  notification_id uuid not null references public.hub_notifications (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, notification_id)
);

alter table public.hub_notifications enable row level security;
alter table public.hub_notification_reads enable row level security;

drop policy if exists "Users read visible notifications" on public.hub_notifications;
create policy "Users read visible notifications"
  on public.hub_notifications for select
  to authenticated
  using (user_id is null or user_id = auth.uid());

drop policy if exists "Users manage own notification reads" on public.hub_notification_reads;
create policy "Users manage own notification reads"
  on public.hub_notification_reads for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
