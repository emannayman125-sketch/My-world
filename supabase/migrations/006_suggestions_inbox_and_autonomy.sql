-- ============================================================
-- شغّليها في: Supabase Dashboard -> SQL Editor -> New query -> Run
-- (بعد ما تكوني شغّلتي 002 لحد 005 قبل كده). آمنة تتشغّل أكتر من مرة.
-- ============================================================

-- صندوق موحّد لأي اقتراح من حمزاوي محتاج قرار (قبول/تجاهل)، عشان لو ما
-- اتصرفش فيه أول ما ظهر، يفضل موجود بدل ما يضيع مع أول تحديث للصفحة.
create table if not exists ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  source text not null check (source in ('daily_brief')),
  kind text not null default 'task',
  title text not null,
  subtitle text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'dismissed')),
  created_at timestamptz default now()
);

create index if not exists ai_suggestions_pending_idx on ai_suggestions(user_id, status, created_at);

alter table ai_suggestions enable row level security;
drop policy if exists "ai_suggestions خاصة بصاحبها" on ai_suggestions;
create policy "ai_suggestions خاصة بصاحبها" on ai_suggestions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- مستوى استقلالية حقيقي وواحد بس، لأنه المكان الوحيد اللي فعلاً بيتظبط
-- فيه بشكل آمن: مهام اليوم المقترحة من ملخص الصبح. لو مفعّل، حمزاوي
-- يضيفها لأهم ٣ من غير ما يستنى ضغطة، وتفضل قابلة للتراجع بسهولة.
alter table profiles add column if not exists auto_add_daily_focus boolean not null default false;
