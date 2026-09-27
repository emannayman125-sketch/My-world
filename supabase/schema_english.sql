-- ============================================================
-- Personal World — English Learning Tracker
-- شغّلي هذا الملف في: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

create table if not exists english_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  topic text,
  vocabulary jsonb default '[]'::jsonb,   -- [{ word, meaning }]
  mistakes jsonb default '[]'::jsonb,     -- [{ mistake, correction }]
  self_rating int,                        -- 1-5, Ahmed's own sense of how it went
  notes text,
  created_at timestamptz default now()
);

alter table english_sessions enable row level security;
create policy "english_sessions خاصة بصاحبها" on english_sessions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists english_sessions_created_at_idx on english_sessions(created_at);
