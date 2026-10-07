-- ============================================================
-- شغّليها في: Supabase Dashboard -> SQL Editor -> New query -> Run
-- (بعد ما تكوني شغّلتي 002 لحد 012 قبل كده). آمنة تتشغّل أكتر من مرة.
-- ============================================================

-- ترتيب الأقسام في صفحته العامة، بيحدده هو بنفسه من صفحة الخصوصية.
alter table profiles add column if not exists public_section_order jsonb
  not null default '["currently","books","podcasts","interests","about","social"]'::jsonb;

-- الـ View العام لازم يعرض الترتيب ده كمان، عشان صفحته العامة تقدر تقراه.
create or replace view public_profiles as
select
  id,
  display_name,
  username,
  avatar_url,
  case when is_bio_public then bio else null end as bio,
  social_links,
  public_section_order
from profiles
where username is not null;

grant select on public_profiles to anon, authenticated;
