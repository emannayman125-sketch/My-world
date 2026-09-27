-- ============================================================
-- Personal World — Time Capsule (رسالة لنفسك في المستقبل)
-- شغّلي هذا الملف في: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

create table if not exists time_capsules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  message text not null,
  reveal_date date not null,
  created_at timestamptz default now()
);

alter table time_capsules enable row level security;
create policy "time_capsules خاصة بصاحبها" on time_capsules for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists time_capsules_reveal_date_idx on time_capsules(reveal_date);
