-- Reassign snippet library from one account to another (run in SQL editor, service role).
-- Replace placeholders before executing. Do not commit real addresses in git.

-- 1) Inspect counts (optional)
-- select user_id, count(*) from public.dev_snippets group by 1;
-- select user_id, count(*) from public.dev_snippet_categories group by 1;

do $$
declare
  legacy_id uuid;
  target_id uuid;
begin
  select id into legacy_id from auth.users where email = '<<legacy_account_email>>' limit 1;
  select id into target_id from auth.users where email = '<<target_account_email>>' limit 1;

  if legacy_id is null then
    raise exception 'Legacy account not found';
  end if;
  if target_id is null then
    raise exception 'Target account not found';
  end if;
  if legacy_id = target_id then
    raise exception 'Legacy and target must differ';
  end if;

  update public.dev_snippet_categories
  set user_id = target_id
  where user_id = legacy_id;

  update public.dev_snippets
  set user_id = target_id
  where user_id = legacy_id;
end $$;
