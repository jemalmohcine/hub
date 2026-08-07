-- Curated, verified AI intel catalogue.
--
-- Every URL below was fetched and returned a real feed. Five previously seeded
-- sources answer 404/403 and are disabled rather than deleted, so the items
-- they already produced keep their foreign key.
--
-- Priority reflects how often a source produces something a developer must act
-- on: status pages and changelogs first, practitioner writing next, general
-- press last.

-- 1. Dead or unusable feeds -------------------------------------------------
--    anthropic-news      404 (RSS removed from anthropic.com)
--    meta-ai-blog        404 (feed removed)
--    deeplearning-batch  404 (feed removed)
--    langchain-blog      serves an HTML page, not a feed
--    producthunt-ai      403 (scraping blocked)
update public.ai_intel_sources
set status = 'disabled', enabled = false, updated_at = now()
where id in (
  'anthropic-news',
  'meta-ai-blog',
  'deeplearning-batch',
  'langchain-blog',
  'producthunt-ai'
);

-- 2. Fixes to existing rows -------------------------------------------------
-- OpenAI moved its feed from /blog to /news.
update public.ai_intel_sources
set url = 'https://openai.com/news/rss.xml', priority = 95, quality_score = 9.5,
    updated_at = now()
where id = 'openai-blog';

-- The old Hacker News query was an unfiltered firehose: every story mentioning
-- "AI" landed in the feed, including single-upvote self-promotion. Requiring
-- real traction is what makes this source usable.
update public.ai_intel_sources
set url = 'https://hn.algolia.com/api/v1/search_by_date?tags=story&numericFilters=points%3E100&query=AI%20OR%20LLM%20OR%20agents',
    priority = 72, quality_score = 8.2, updated_at = now()
where id = 'hn-ai';

-- General tech press: rarely actionable for a developer, keep but demote.
update public.ai_intel_sources
set priority = 40, quality_score = 6.0, updated_at = now()
where id in ('techcrunch-ai', 'mit-tech-review-ai', 'gnews-ai-policy');

-- SEO-farm aggregation of an over-broad query — no usable signal.
update public.ai_intel_sources
set status = 'disabled', enabled = false, updated_at = now()
where id = 'gnews-ai-models';

-- The generic GitHub blog is mostly marketing; the changelog below replaces it.
update public.ai_intel_sources
set priority = 55, quality_score = 7.0, updated_at = now()
where id = 'github-blog';

-- 3. Expert additions -------------------------------------------------------
insert into public.ai_intel_sources
  (id, name, url, kind, pillar_hints, priority, status, quality_score) values
  -- Incidents: the only sources that matter within the hour.
  ('openai-status', 'OpenAI Status', 'https://status.openai.com/history.rss',
   'rss', array['models'], 99, 'active', 9.8),
  ('anthropic-status', 'Anthropic Status', 'https://status.anthropic.com/history.rss',
   'rss', array['models'], 99, 'active', 9.8),
  ('vercel-status', 'Vercel Status', 'https://www.vercel-status.com/history.rss',
   'rss', array['tools'], 96, 'active', 9.4),

  -- Changelogs: where deprecations, breaking changes and pricing land first.
  ('github-changelog', 'GitHub Changelog', 'https://github.blog/changelog/feed/',
   'rss', array['tools','opensource'], 94, 'active', 9.4),
  ('openai-announcements', 'OpenAI API Announcements',
   'https://community.openai.com/c/announcements/6.rss',
   'rss', array['models','tools'], 93, 'active', 9.2),
  ('claude-code-releases', 'Claude Code Releases',
   'https://github.com/anthropics/claude-code/releases.atom',
   'rss', array['tools'], 92, 'active', 9.2),
  ('nextjs-releases', 'Next.js Releases',
   'https://github.com/vercel/next.js/releases.atom',
   'rss', array['tools','opensource'], 90, 'active', 9.0),
  ('aisdk-releases', 'Vercel AI SDK Releases',
   'https://github.com/vercel/ai/releases.atom',
   'rss', array['tools','opensource'], 88, 'active', 8.8),

  -- Vendor research and model announcements.
  ('deepmind-blog', 'Google DeepMind',
   'https://blog.google/technology/google-deepmind/rss/',
   'rss', array['models'], 86, 'active', 8.8),
  ('ollama-blog', 'Ollama', 'https://ollama.com/blog/rss.xml',
   'rss', array['models','opensource'], 80, 'active', 8.4)
on conflict (id) do update set
  name = excluded.name,
  url = excluded.url,
  kind = excluded.kind,
  pillar_hints = excluded.pillar_hints,
  priority = excluded.priority,
  status = excluded.status,
  enabled = true,
  quality_score = excluded.quality_score,
  updated_at = now();
