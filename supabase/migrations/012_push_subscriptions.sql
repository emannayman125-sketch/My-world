-- ============================================================
-- شغّليها في: Supabase Dashboard -> SQL Editor -> New query -> Run
-- (بعد ما تكوني شغّلتي 002 لحد 011 قبل كده). آمنة تتشغّل أكتر من مرة.
-- ============================================================
-- تخزين اشتراك الإشعارات (Push) بتاع كل جهاز فعّله أحمد بنفسه.

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth_key text not null,
  created_at timestamptz default now()
);

alter table push_subscriptions enable row level security;

drop policy if exists "push_subscriptions خاصة بصاحبها" on push_subscriptions;
create policy "push_subscriptions خاصة بصاحبها" on push_subscriptions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
