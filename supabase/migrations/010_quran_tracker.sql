-- ============================================================
-- شغّليها في: Supabase Dashboard -> SQL Editor -> New query -> Run
-- (بعد ما تكوني شغّلتي 002 لحد 009 قبل كده). آمنة تتشغّل أكتر من مرة.
-- ============================================================

-- كل جزء بيحفظه (سورة أو مدى آيات): بيبدأ "بيحفظه"، وبعد ما يخلّص
-- الحفظ بيتحول لمراجعة بفترات متباعدة بتكبر كل مرة يراجعها فيها.
create table if not exists quran_portions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  surah text not null,
  from_ayah int,
  to_ayah int,
  status text not null default 'memorizing' check (status in ('memorizing', 'reviewing')),
  review_level int not null default 0,
  last_reviewed_date date,
  next_review_date date,
  created_at timestamptz default now()
);

-- سجل بسيط لكل مرة اتحفظ أو اتراجع فيها جزء، عشان الملخص الأسبوعي
-- (بيوم الحفظ، وعدد المراجعات، وأيام المذاكرة) يبقى حقيقي مش تخمين.
create table if not exists quran_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  portion_id uuid references quran_portions(id) on delete cascade,
  kind text not null check (kind in ('memorized', 'reviewed')),
  event_date date not null,
  created_at timestamptz default now()
);

alter table quran_portions enable row level security;
drop policy if exists "quran_portions خاصة بصاحبها" on quran_portions;
create policy "quran_portions خاصة بصاحبها" on quran_portions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table quran_events enable row level security;
drop policy if exists "quran_events خاصة بصاحبها" on quran_events;
create policy "quran_events خاصة بصاحبها" on quran_events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
