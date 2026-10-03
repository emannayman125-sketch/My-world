-- ============================================================
-- شغّليها في: Supabase Dashboard -> SQL Editor -> New query -> Run
-- (بعد ما تكوني شغّلتي 002 لحد 010 قبل كده). آمنة تتشغّل أكتر من مرة.
-- ============================================================

-- خلاصة يوم التداول: سطر واحد في اليوم، بيتملى بعد ما يخلّص جلسته على
-- منصته الحقيقية — مش أثناء التداول. ده بديل التسجيل اللحظي لكل صفقة.
create table if not exists trading_day_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  note_date date not null default current_date,
  net_pnl numeric,
  trade_count int,
  feeling text,
  lesson text,
  followed_rules boolean,
  created_at timestamptz default now(),
  unique (user_id, note_date)
);

alter table trading_day_notes enable row level security;
drop policy if exists "trading_day_notes خاصة بصاحبها" on trading_day_notes;
create policy "trading_day_notes خاصة بصاحبها" on trading_day_notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
