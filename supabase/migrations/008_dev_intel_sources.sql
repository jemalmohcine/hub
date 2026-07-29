-- Extra dev-focused AI intel sources (idempotent)
insert into public.ai_intel_sources (id, name, url, kind, pillar_hints, priority, status, quality_score) values
  ('simon-willison', 'Simon Willison', 'https://simonwillison.net/atom/everything/', 'rss', array['models','tools','opensource'], 92, 'active', 9.5),
  ('langchain-blog', 'LangChain Blog', 'https://blog.langchain.dev/rss/', 'rss', array['tools','opensource'], 88, 'active', 9.0),
  ('nvidia-dev-blog', 'NVIDIA Developer Blog', 'https://developer.nvidia.com/blog/feed', 'rss', array['models','tools'], 82, 'active', 8.5),
  ('techcrunch-ai', 'TechCrunch AI', 'https://techcrunch.com/category/artificial-intelligence/feed/', 'rss', array['models','tools','world'], 78, 'active', 8.0),
  ('deeplearning-batch', 'The Batch', 'https://www.deeplearning.ai/the-batch/feed/', 'rss', array['models'], 86, 'active', 8.8),
  ('cursor-changelog', 'Cursor Changelog', 'https://www.cursor.com/changelog/rss.xml', 'rss', array['tools'], 90, 'active', 9.2),
  ('mit-tech-review-ai', 'MIT Tech Review AI', 'https://www.technologyreview.com/topic/artificial-intelligence/feed', 'rss', array['models','world'], 76, 'active', 8.0),
  ('lobsters-ai', 'Lobsters AI', 'https://lobste.rs/t/ai.rss', 'rss', array['tools','opensource'], 74, 'active', 7.8)
on conflict (id) do update set
  name = excluded.name,
  url = excluded.url,
  kind = excluded.kind,
  pillar_hints = excluded.pillar_hints,
  priority = excluded.priority,
  quality_score = excluded.quality_score,
  updated_at = now();
