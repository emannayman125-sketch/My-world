-- ============================================================
-- شغّليها في: Supabase Dashboard -> SQL Editor -> New query -> Run
-- آمنة تمامًا تتشغّل أكتر من مرة (كل سطر بيتفحص قبل ما يتنفذ).
-- ============================================================

-- ------------------------------------------------------------
-- ١) تسكير التسريب: صور الذكريات واليوميات كانت في Bucket عام،
--    يعني أي حد معاه اللينك كان يقدر يشوفها حتى من غير حساب،
--    رغم إن جدولي notes و memories نفسهم خاصين تمامًا.
--    بعد السطور دي: الصور تتعرض بس لصاحبها (رابط موقّت لما يفتح الصفحة).
-- ------------------------------------------------------------
update storage.buckets set public = false where id = 'memory-photos';

drop policy if exists "memory-photos يشوفها أي حد (Bucket عام)" on storage.objects;

drop policy if exists "memory-photos يشوفها صاحبها بس" on storage.objects;
create policy "memory-photos يشوفها صاحبها بس" on storage.objects for select
  using (bucket_id = 'memory-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ------------------------------------------------------------
-- ٢) لينكات حساباته الشخصية اللي تظهر في صفحته العامة بس
--    (إنستجرام، يوتيوب، تيك توك، X، موقع شخصي) — تتحط باختياره.
-- ------------------------------------------------------------
alter table profiles add column if not exists social_links jsonb not null default '{}'::jsonb;

create or replace view public_profiles as
select
  id,
  display_name,
  username,
  avatar_url,
  case when is_bio_public then bio else null end as bio,
  social_links
from profiles
where username is not null;

grant select on public_profiles to anon, authenticated;
