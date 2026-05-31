-- Article view counter for ExtraFun (front-only Vite + Supabase anon key).
-- RLS allows only SELECT on articles, so anon cannot UPDATE views directly.
-- SECURITY DEFINER function bumps views by 1 and nothing else — safe for anon.
-- Applied to Supabase project lvxaycjuhchoqhnttyjj on 2026-05-31.

create or replace function increment_article_views(article_id int)
returns void language sql security definer as $$
  update articles set views = coalesce(views, 0) + 1 where id = article_id;
$$;

grant execute on function increment_article_views(int) to anon, authenticated;
