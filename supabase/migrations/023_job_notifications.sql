-- Job follow-up + matching-offer notifications.

alter table public.hub_notifications
  drop constraint if exists hub_notifications_category_check;

alter table public.hub_notifications
  add constraint hub_notifications_category_check
  check (category in ('ai', 'billing', 'account', 'system', 'jobs'));
