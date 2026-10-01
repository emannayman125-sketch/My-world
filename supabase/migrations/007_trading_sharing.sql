-- ============================================================
-- شغّليها في: Supabase Dashboard -> SQL Editor -> New query -> Run
-- (بعد ما تكوني شغّلتي 002 لحد 006 قبل كده). آمنة تتشغّل أكتر من مرة.
-- ============================================================
--
-- المبدأ: كل حاجة خاصة بأحمد لوحده افتراضيًا. المشاركة اختيار منه بس،
-- لشخصه المقبول (partner_links.status='accepted')، وهو اللي يحدد المستوى:
-- - اطفي (الافتراضي): حد تاني مايشوفش حاجة.
-- - يشوف بس: شريكه يقدر يشوف دفتر التداول بتاعه.
-- - يشوف ويسجل معاه: شريكه يقدر كمان يضيف صفقات لنفس الدفتر، وكل صفقة
--   بتتسجل مين اللي كتبها (logged_by) عشان يفضل واضح مين عمل إيه.

alter table profiles add column if not exists trading_shared boolean not null default false;
alter table profiles add column if not exists trading_partner_can_log boolean not null default false;

alter table trading_journal add column if not exists logged_by uuid references auth.users(id) on delete set null;

-- يشوف الدفتر: صاحبه، أو شريكه المقبول لو هو فعّل trading_shared
drop policy if exists "trading_journal يشوفه صاحبه أو شريكه لو اتفعّلت المشاركة" on trading_journal;
create policy "trading_journal يشوفه صاحبه أو شريكه لو اتفعّلت المشاركة" on trading_journal for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from partner_links pl
      join profiles p on p.id = trading_journal.user_id
      where pl.status = 'accepted' and p.trading_shared = true
        and ((pl.user_a = auth.uid() and pl.user_b = trading_journal.user_id)
          or (pl.user_b = auth.uid() and pl.user_a = trading_journal.user_id))
    )
  );

-- يسجّل صفقة: صاحب الدفتر دايمًا، أو شريكه لو فعّل trading_partner_can_log
-- كمان (مش بس trading_shared) -- المشاهدة والتسجيل قرارين منفصلين.
drop policy if exists "trading_journal يسجّل فيه صاحبه أو شريكه لو اتسمحله" on trading_journal;
create policy "trading_journal يسجّل فيه صاحبه أو شريكه لو اتسمحله" on trading_journal for insert
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from partner_links pl
      join profiles p on p.id = trading_journal.user_id
      where pl.status = 'accepted' and p.trading_partner_can_log = true
        and logged_by = auth.uid()
        and ((pl.user_a = auth.uid() and pl.user_b = trading_journal.user_id)
          or (pl.user_b = auth.uid() and pl.user_a = trading_journal.user_id))
    )
  );

-- جلسة اليوم (الحدود اللي أحمد حطها لنفسه) تتشاف بس، محدش تاني يقدر يعدلها.
drop policy if exists "trading_sessions يشوفها صاحبها أو شريكه لو اتفعّلت المشاركة" on trading_sessions;
create policy "trading_sessions يشوفها صاحبها أو شريكه لو اتفعّلت المشاركة" on trading_sessions for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from partner_links pl
      join profiles p on p.id = trading_sessions.user_id
      where pl.status = 'accepted' and p.trading_shared = true
        and ((pl.user_a = auth.uid() and pl.user_b = trading_sessions.user_id)
          or (pl.user_b = auth.uid() and pl.user_a = trading_sessions.user_id))
    )
  );
