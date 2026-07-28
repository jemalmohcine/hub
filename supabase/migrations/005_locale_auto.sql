-- Default language follows the browser; users can override in Settings.
alter table public.user_preferences
  alter column locale set default 'auto';

-- Reset previous product default (fr) so language follows the browser.
-- Users who want a fixed language can set FR or EN in Settings.
update public.user_preferences
set locale = 'auto'
where locale is null or locale = 'fr';
