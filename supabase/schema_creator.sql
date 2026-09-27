-- ============================================================
-- Personal World — Creator Studio (بودكاست/محتوى مستقبلًا)
-- شغّلي هذا الملف في: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  hook text,
  script text,
  notes text,
  references_text text,
  thumbnail_idea text,
  recording_notes text,
  platform text default 'other', -- youtube | podcast | instagram | tiktok | linkedin | other
  status text default 'idea',    -- idea | research | script | recording | editing | ready | published
  publish_date date,
  published_url text,
  created_at timestamptz default now()
);

alter table content_items enable row level security;
create policy "content_items خاصة بصاحبها" on content_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists content_items_status_idx on content_items(status);
