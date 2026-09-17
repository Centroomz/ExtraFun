-- EF: impresje i kliki kart (artykuł / lokal / anons), agregat dzienny, bez IP i bez user id.
-- Applied to Supabase project lvxaycjuhchoqhnttyjj on 2026-09-17 (migration ef_card_stats).
create table if not exists card_stats (
  site        text not null default 'extrafun',
  kind        text not null check (kind in ('article','venue','ad')),
  ref_id      text not null,
  day         date not null default current_date,
  impressions integer not null default 0,
  clicks      integer not null default 0,
  primary key (site, kind, ref_id, day)
);
alter table card_stats enable row level security;

create or replace function bump_card_stat(p_kind text, p_ref text, p_ev text, p_site text default 'extrafun')
returns void language sql security definer as $$
  insert into card_stats (site, kind, ref_id, day, impressions, clicks)
  values (p_site, p_kind, p_ref, current_date,
          case when p_ev = 'imp' then 1 else 0 end,
          case when p_ev = 'click' then 1 else 0 end)
  on conflict (site, kind, ref_id, day) do update set
    impressions = card_stats.impressions + excluded.impressions,
    clicks      = card_stats.clicks      + excluded.clicks;
$$;
-- Only the server (service_role) calls this — never the browser.
revoke execute on function bump_card_stat(text, text, text, text) from anon, authenticated, public;
