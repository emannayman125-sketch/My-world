-- ============================================================
-- شغّليها في: Supabase Dashboard -> SQL Editor -> New query -> Run
-- (بعد ما تكوني شغّلتي 002 و003 قبل كده). آمنة تتشغّل أكتر من مرة.
-- ============================================================

-- الاتجاه (Long/Short) والعمولات، مهمين في الـ scalping عشان الصافي الحقيقي.
alter table trading_journal add column if not exists direction text;
alter table trading_journal drop constraint if exists trading_journal_direction_check;
alter table trading_journal add constraint trading_journal_direction_check check (direction in ('long', 'short'));

alter table trading_journal add column if not exists fees numeric default 0;

-- قواعد الجلسة اللي بيحددها هو بنفسه كل يوم (حد خسارة، أقصى عدد صفقات،
-- أقصى خسائر متتالية). الموقع بينبّه لما تتكسر، وما يمنعش — يقترح مش يجبر.
create table if not exists trading_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_date date not null default current_date,
  max_loss numeric,
  max_trades int,
  max_consecutive_losses int,
  created_at timestamptz default now(),
  unique (user_id, session_date)
);

alter table trading_sessions enable row level security;
drop policy if exists "trading_sessions خاصة بصاحبها" on trading_sessions;
create policy "trading_sessions خاصة بصاحبها" on trading_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
