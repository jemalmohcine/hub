-- Per-user read state for AI intel items
create table if not exists public.ai_intel_reads (
  user_id uuid not null references public.profiles (id) on delete cascade,
  item_id uuid not null references public.ai_intel_items (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create index if not exists ai_intel_reads_user_idx
  on public.ai_intel_reads (user_id, read_at desc);

alter table public.ai_intel_reads enable row level security;

drop policy if exists "Users manage own ai reads" on public.ai_intel_reads;
create policy "Users manage own ai reads"
  on public.ai_intel_reads for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
