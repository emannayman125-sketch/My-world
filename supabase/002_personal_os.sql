-- ============================================================
-- Personal World — Personal OS Schema (Phase 2)
-- شغّلي هذا الملف في: Supabase Dashboard -> SQL Editor -> New query
-- (بعد ما يكون schema.sql الأساسي شغال بالفعل)
--
-- ده بيضيف: MBA/Learning Hub, Library, Trading Desk, Business Hub,
-- Creator Studio, وجدول entity_links اللي بيربط أي حاجة بأي حاجة
-- (كتاب بملاحظة، ملاحظة ببحث، بحث بفكرة، فكرة بمحتوى...).
-- ============================================================

-- ---------- entity_links: الرابط العام بين أي عنصرين في عالم أحمد ----------
-- from_type / to_type أمثلة: 'book' | 'note' | 'research' | 'idea'
--   | 'content_item' | 'course' | 'trade' | 'business_project'
create table if not exists entity_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  from_type text not null,
  from_id uuid not null,
  to_type text not null,
  to_id uuid not null,
  created_at timestamptz default now(),
  unique (user_id, from_type, from_id, to_type, to_id)
);

alter table entity_links enable row level security;
create policy "الروابط خاصة بصاحبها" on entity_links for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ================= 🎓 MBA / Learning Hub =================

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  term text,
  color text default '#E8A855',
  created_at timestamptz default now()
);
alter table subjects enable row level security;
create policy "المواد خاصة بصاحبها" on subjects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  subject_id uuid references subjects(id) on delete set null,
  name text not null,
  code text,
  instructor text,
  term text,
  created_at timestamptz default now()
);
alter table courses enable row level security;
create policy "الكورسات خاصة بصاحبها" on courses for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists research_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  course_id uuid references courses(id) on delete set null,
  title text not null,
  research_question text,
  status text default 'idea', -- idea | researching | draft | finished
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table research_projects enable row level security;
create policy "الأبحاث خاصة بصاحبها" on research_projects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists research_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  research_id uuid references research_projects(id) on delete cascade,
  url text not null,
  label text,
  created_at timestamptz default now()
);
alter table research_links enable row level security;
create policy "روابط الأبحاث خاصة بصاحبها" on research_links for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists deadlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  due_date date not null,
  kind text default 'assignment', -- assignment | exam | deadline | study
  course_id uuid references courses(id) on delete set null,
  research_id uuid references research_projects(id) on delete set null,
  is_done boolean default false,
  created_at timestamptz default now()
);
alter table deadlines enable row level security;
create policy "المواعيد النهائية خاصة بصاحبها" on deadlines for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ================= 📚 Library =================

create table if not exists library_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  author text,
  file_path text, -- path inside the 'library' storage bucket
  file_type text default 'pdf', -- pdf | epub
  cover_url text,
  status text default 'unread', -- unread | reading | finished
  progress_page int default 0,
  page_count int,
  created_at timestamptz default now()
);
alter table library_books enable row level security;
create policy "الكتب خاصة بصاحبها" on library_books for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists book_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  book_id uuid references library_books(id) on delete cascade,
  page int,
  content text not null,
  is_bookmark boolean default false,
  created_at timestamptz default now()
);
alter table book_notes enable row level security;
create policy "ملاحظات الكتب خاصة بصاحبها" on book_notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage: لازم تتعمل من Supabase Dashboard -> Storage -> New bucket
--   اسم الـ bucket: library   |   Public: false
-- وبعدها شغّلي السطور دي عشان الشخص يقدر يرفع ويقرأ ملفاته هو بس:
insert into storage.buckets (id, name, public)
values ('library', 'library', false)
on conflict (id) do nothing;

create policy "كل حد يدير ملفاته هو بس في library"
  on storage.objects for all
  using (bucket_id = 'library' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'library' and auth.uid()::text = (storage.foldername(name))[1]);


-- ================= 📈 Trading Desk =================

create table if not exists watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  symbol text not null,
  note text,
  status text default 'watching', -- watching | setup | entered
  created_at timestamptz default now()
);
alter table watchlist_items enable row level security;
create policy "الـ watchlist خاصة بصاحبها" on watchlist_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  symbol text not null,
  entry_price numeric,
  exit_price numeric,
  position_size numeric,
  stop_loss numeric,
  target numeric,
  strategy text,
  reason_for_entry text,
  result text, -- win | loss | breakeven | open
  emotional_state text,
  lesson_learned text,
  screenshot_url text,
  entry_date date,
  exit_date date,
  created_at timestamptz default now()
);
alter table trades enable row level security;
create policy "الصفقات خاصة بصاحبها" on trades for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ================= 🏗️ Business Hub =================

create table if not exists business_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  status text default 'active', -- active | on_hold | done
  description text,
  created_at timestamptz default now()
);
alter table business_projects enable row level security;
create policy "مشاريع البيزنس خاصة بصاحبها" on business_projects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists business_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  kind text default 'client', -- client | lead | supplier
  contact_info text,
  stage text, -- for leads: new | contacted | negotiating | won | lost
  notes text,
  created_at timestamptz default now()
);
alter table business_contacts enable row level security;
create policy "جهات الاتصال خاصة بصاحبها" on business_contacts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists business_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  stage text default 'idea', -- idea | research | plan | execute
  created_at timestamptz default now()
);
alter table business_ideas enable row level security;
create policy "أفكار البيزنس خاصة بصاحبها" on business_ideas for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ================= 🎙️ Creator Studio =================

create table if not exists creator_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text default 'topic', -- video | podcast | topic
  title text not null,
  notes text,
  status text default 'idea', -- idea | in_progress | scheduled | published
  created_at timestamptz default now()
);
alter table creator_ideas enable row level security;
create policy "أفكار الكرييتور خاصة بصاحبها" on creator_ideas for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  idea_id uuid references creator_ideas(id) on delete set null,
  type text default 'script', -- script | hook | title | thumbnail_idea
  body text,
  publish_date date,
  created_at timestamptz default now()
);
alter table content_items enable row level security;
create policy "عناصر المحتوى خاصة بصاحبها" on content_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
