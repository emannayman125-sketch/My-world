-- ============================================================
-- Personal World — MBA & Learning Hub
-- شغّلي هذا الملف في: Supabase Dashboard -> SQL Editor -> New query
-- (بعد ما يكون schema.sql الأساسي شغال بالفعل)
-- ============================================================

-- ---------- المواد الدراسية ----------
create table if not exists mba_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  professor text,
  description text,
  schedule text,
  progress int default 0, -- 0-100
  created_at timestamptz default now()
);

alter table mba_courses enable row level security;
create policy "mba_courses خاصة بصاحبها" on mba_courses for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- الـ Assignments ----------
create table if not exists mba_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  course_id uuid references mba_courses(id) on delete set null,
  title text not null,
  description text,
  due_date date,
  status text default 'not_started', -- not_started | in_progress | submitted | completed
  notes text,
  created_at timestamptz default now()
);

alter table mba_assignments enable row level security;
create policy "mba_assignments خاصة بصاحبها" on mba_assignments for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- مشاريع البحث ----------
create table if not exists research_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  course_id uuid references mba_courses(id) on delete set null,
  title text not null,
  question text,
  description text,
  status text default 'idea', -- idea | researching | draft | reviewing | finished
  deadline date,
  created_at timestamptz default now()
);

alter table research_projects enable row level security;
create policy "research_projects خاصة بصاحبها" on research_projects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- ملاحظات البحث / الـ Knowledge Base ----------
-- ملاحظة أو اقتباس أو فكرة أو لينك، ممكن ترتبط ببحث و/أو مادة دراسية،
-- عشان تفضل مرتبطة بمصدرها بدل ما تبقى ملاحظة تايهة.
create table if not exists research_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  research_id uuid references research_projects(id) on delete cascade,
  course_id uuid references mba_courses(id) on delete set null,
  kind text default 'note', -- note | quote | idea | link
  content text not null,
  url text,
  created_at timestamptz default now()
);

alter table research_notes enable row level security;
create policy "research_notes خاصة بصاحبها" on research_notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists research_notes_research_id_idx on research_notes(research_id);
create index if not exists mba_assignments_course_id_idx on mba_assignments(course_id);
