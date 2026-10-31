# Migrations Supabase

Apply in filename order. Two files share prefix `025_` (`025_job_search_last_scraped.sql` then `025_job_user_listings_ttl.sql`) — both must run; do not renumber on databases already migrated.

Fresh security / product migrations: `027` (subscriptions RLS), `028` (purge veille demo), `029` (dev_tool_saves).
