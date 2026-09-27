-- ============================================================
-- Personal World — Business Hub (بيزنس المقاولات)
-- شغّلي هذا الملف في: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- ---------- المشاريع ----------
create table if not exists business_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  client text,
  status text default 'planning', -- planning | active | on_hold | completed
  deadline date,
  budget numeric,
  notes text,
  created_at timestamptz default now()
);

alter table business_projects enable row level security;
create policy "business_projects خاصة بصاحبها" on business_projects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- جهات الاتصال (عملاء / موردين / Leads) ----------
create table if not exists business_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  type text default 'client', -- client | supplier | lead | other
  phone text,
  email text,
  notes text,
  project_id uuid references business_projects(id) on delete set null,
  created_at timestamptz default now()
);

alter table business_contacts enable row level security;
create policy "business_contacts خاصة بصاحبها" on business_contacts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- أفكار البيزنس ----------
create table if not exists business_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  stage text default 'idea', -- idea | research | plan | execute
  market_research text,
  costs text,
  opportunities text,
  risks text,
  next_actions text,
  created_at timestamptz default now()
);

alter table business_ideas enable row level security;
create policy "business_ideas خاصة بصاحبها" on business_ideas for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists business_contacts_project_id_idx on business_contacts(project_id);
