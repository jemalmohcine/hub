-- Clients must not mutate subscription rows (free app; billing out of scope).
-- Reads stay on own row; writes only via service role / future PSP webhook.

drop policy if exists "Users can update own subscription (mock billing)" on public.subscriptions;
drop policy if exists "Users can insert own subscription" on public.subscriptions;
