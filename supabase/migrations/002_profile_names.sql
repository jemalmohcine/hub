-- Add first_name / last_name for existing Phase 1 databases

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text;

-- Backfill from display_name when possible (first token → first_name, rest → last_name)
update public.profiles
set
  first_name = coalesce(
    first_name,
    nullif(split_part(trim(display_name), ' ', 1), '')
  ),
  last_name = coalesce(
    last_name,
    nullif(
      trim(substring(trim(display_name) from length(split_part(trim(display_name), ' ', 1)) + 1)),
      ''
    )
  )
where display_name is not null
  and trim(display_name) <> ''
  and first_name is null
  and last_name is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, display_name, avatar_url)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data->>'first_name', ''),
    nullif(new.raw_user_meta_data->>'last_name', ''),
    coalesce(
      nullif(trim(concat_ws(' ',
        new.raw_user_meta_data->>'first_name',
        new.raw_user_meta_data->>'last_name'
      )), ''),
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.user_preferences (user_id) values (new.id);
  insert into public.subscriptions (user_id, plan, status) values (new.id, 'free', 'active');

  return new;
end;
$$;
