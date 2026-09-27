-- ============================================================
-- Personal World — Trading Desk (مضاربة ناسداك)
-- شغّلي هذا الملف في: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- ---------- Watchlist ----------
create table if not exists trading_watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  symbol text not null,          -- مثلاً AAPL
  status text default 'watching', -- watching | setup | entered
  thesis text,                    -- ليه الرمز ده مهم دلوقتي
  notes text,
  created_at timestamptz default now()
);

alter table trading_watchlist enable row level security;
create policy "trading_watchlist خاصة بصاحبها" on trading_watchlist for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Trading Journal ----------
create table if not exists trading_journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  symbol text not null,
  trade_date date default current_date,
  entry_price numeric,
  exit_price numeric,
  position_size numeric,
  stop_loss numeric,
  target numeric,
  strategy text,
  reason_entry text,
  result text,             -- win | loss | breakeven | open
  pnl numeric,             -- ربح/خسارة فعلي (بالدولار)، لو حبيت تسجله يدوي
  emotional_state text,
  lessons_learned text,
  screenshot_path text,    -- مسار جوه bucket "trading-screenshots"
  created_at timestamptz default now()
);

alter table trading_journal enable row level security;
create policy "trading_journal خاصة بصاحبها" on trading_journal for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Storage bucket للقطة الشاشة ----------
insert into storage.buckets (id, name, public)
values ('trading-screenshots', 'trading-screenshots', false)
on conflict (id) do nothing;

create policy "trading-screenshots: قراءة ملفات الشخص نفسه"
  on storage.objects for select
  using (bucket_id = 'trading-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "trading-screenshots: رفع ملفات الشخص نفسه"
  on storage.objects for insert
  with check (bucket_id = 'trading-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "trading-screenshots: حذف ملفات الشخص نفسه"
  on storage.objects for delete
  using (bucket_id = 'trading-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

create index if not exists trading_journal_date_idx on trading_journal(trade_date);
