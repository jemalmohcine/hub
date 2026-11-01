-- Fix infinite recursion on profiles SELECT (admin policy subquery re-entered RLS).
-- Apply in Supabase SQL editor if preview/prod already ran 001 without this fix.

create or replace function public.auth_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

revoke all on function public.auth_profile_role() from public;
grant execute on function public.auth_profile_role() to authenticated, service_role;

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.auth_profile_role() = 'admin');

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = coalesce(public.auth_profile_role(), role)
  );

drop policy if exists "Admins can update module flags" on public.module_flags;
create policy "Admins can update module flags"
  on public.module_flags for update
  using (public.auth_profile_role() = 'admin');
