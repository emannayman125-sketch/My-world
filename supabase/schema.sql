-- ============================================================
-- Personal World — Database Schema (Phase 1 + جزء من الأساس لبقية المراحل)
-- شغّلي هذا الملف كامل في: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- ---------- الملف الشخصي ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text default 'أحمد حمزة',
  username text unique,
  has_seen_welcome boolean default false,
  theme_preference text default 'light',
  bio text,
  is_bio_public boolean default false,
  birthday_month int default 10,
  birthday_day int default 11,
  last_birthday_shown_year int,
  avatar_url text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "الشخص يشوف بروفايله بس"
  on profiles for select using (auth.uid() = id);

create policy "الشخص يعدّل بروفايله بس"
  on profiles for update using (auth.uid() = id);

create policy "الشخص يعمل بروفايله وقت التسجيل"
  on profiles for insert with check (auth.uid() = id);

-- ملحوظة أمان: ما بنعملش policy عامة على جدول profiles نفسه لأي حد بدون تسجيل دخول،
-- لأن ده كان هيسمح لأي حد يقرا الصف كامل (بما فيه البايو الخاص وتاريخ الميلاد) عن طريق
-- استدعاء الـ API مباشرة، حتى لو الكود بتاعنا مش بيعرضهم. بدل كده، فيه View آمن تحت
-- (public_profiles) بيوفّر بس الأعمدة المسموح تكون عامة.

-- إنشاء صف بروفايل تلقائيًا عند تسجيل مستخدم جديد
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- Top 3 اليوم ----------
create table if not exists top3_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  is_done boolean default false,
  for_date date default current_date,
  created_at timestamptz default now()
);

alter table top3_tasks enable row level security;
create policy "top3 خاص بصاحبه" on top3_tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- المهام العامة ----------
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  is_done boolean default false,
  priority text default 'normal', -- 'high' | 'important' | 'normal'
  due_date date,
  created_at timestamptz default now()
);

alter table tasks enable row level security;
create policy "tasks خاصة بصاحبها" on tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- التقويم / المواعيد ----------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  category text default 'شخصي', -- عمل / دراسة / شخصي / صحة / مهم
  event_date date not null,
  event_time time,
  notes text,
  created_at timestamptz default now()
);

alter table events enable row level security;
create policy "events خاصة بصاحبها" on events for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- العادات ----------
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  emoji text default '🔥',
  current_streak int default 0,
  created_at timestamptz default now()
);

alter table habits enable row level security;
create policy "habits خاصة بصاحبها" on habits for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  done_date date default current_date
);

alter table habit_logs enable row level security;
create policy "habit_logs خاصة بصاحبها" on habit_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- الأهداف ----------
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  period text default 'weekly', -- weekly | monthly
  progress int default 0, -- 0 - 100
  created_at timestamptz default now()
);

alter table goals enable row level security;
create policy "goals خاصة بصاحبها" on goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- الملاحظات / اليومية ----------
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  kind text default 'note', -- note | journal | quote | learned | treasure
  content text not null,
  image_url text, -- للحاجات اللي في "أشياء عايز أفتكرها"
  created_at timestamptz default now()
);

alter table notes enable row level security;
create policy "notes خاصة بصاحبها" on notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- إزاي حاسس النهاردة (اختياري، انعكاس بسيط بدون أي تحليل) ----------
create table if not exists daily_moods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  mood_date date default current_date,
  mood text not null, -- good | okay | tired | energized | rough
  created_at timestamptz default now(),
  unique (user_id, mood_date)
);

alter table daily_moods enable row level security;
create policy "daily_moods خاصة بصاحبها" on daily_moods for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Currently (بيسمع / بيتفرج / بيقرأ) ----------
create table if not exists currently_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  kind text not null, -- listening | watching | reading
  title text not null,
  subtitle text, -- مثلاً اسم المؤلف أو الفنان
  is_public boolean default false,
  created_at timestamptz default now()
);

alter table currently_items enable row level security;
create policy "currently خاصة بصاحبها" on currently_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "currently العام يظهر لأي حد" on currently_items for select
  using (is_public = true);

-- ---------- الاهتمامات ----------
create table if not exists interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  category text not null, -- كتب / رياضة / تكنولوجيا / سفر ...
  value text not null,
  is_public boolean default false,
  created_at timestamptz default now()
);

alter table interests enable row level security;
create policy "interests خاصة بصاحبها" on interests for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "interests العامة تظهر لأي حد" on interests for select
  using (is_public = true);

-- ============================================================
-- أساس خاصية "شارك التقدم مع شخص تاني" (هتُستخدم بالكامل في مرحلة لاحقة)
-- الفكرة: ربط ثنائي بين حسابين، كل واحد يوافق، وبعدها يشوفوا تقدم بعض
-- في مهام/أهداف معينة اختارها كل واحد إنه "مشترك"
-- ============================================================
create table if not exists partner_links (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references auth.users(id) on delete cascade,
  user_b uuid references auth.users(id) on delete cascade,
  status text default 'pending', -- pending | accepted
  created_at timestamptz default now()
);

alter table partner_links enable row level security;
create policy "partner_links يشوفها طرفيها بس" on partner_links for select
  using (auth.uid() = user_a or auth.uid() = user_b);

-- الطالب (اللي حط كود التاني) هو بس اللي يقدر ينشئ الطلب، وباسم نفسه كـ user_b
-- (user_a = صاحب الكود اللي هيوافق، user_b = اللي طلب الربط)
create policy "partner_links الطالب بس يبدأ الطلب" on partner_links for insert
  with check (auth.uid() = user_b);

-- بس صاحب الكود (المستهدف، user_a) هو اللي يقدر يوافق على الطلب ويحوّله accepted.
-- الطالب (user_b) ما يقدرش يوافق على طلب نفسه بنفسه.
create policy "partner_links المستهدف بس يوافق" on partner_links for update
  using (auth.uid() = user_a)
  with check (status = 'accepted');

create policy "partner_links يمسحها طرفيها (رفض أو فصل)" on partner_links for delete
  using (auth.uid() = user_a or auth.uid() = user_b);

-- عمود على المهام/الأهداف لتحديد إن العنصر ده "مشترك" ويظهر للطرف التاني
alter table goals add column if not exists is_shared boolean default false;
alter table tasks add column if not exists is_shared boolean default false;

-- رابط اختياري لأي عنصر (يوتيوب بيتشغّل جوه الموقع، أي رابط تاني بيتفتح في تاب جديد)
alter table tasks add column if not exists link_url text;
alter table goals add column if not exists link_url text;
alter table events add column if not exists link_url text;

-- لتتبع الحدث اللي اتزامن مع Google Calendar (يمنع تكرار نفس الحدث)
alter table events add column if not exists google_event_id text;

-- الشريك المقبول يشوف الأهداف/المهام اللي حددها الطرف التاني كـ "مشتركة" بس
create policy "goals المشتركة يشوفها الشريك المقبول" on goals for select
  using (
    is_shared = true and exists (
      select 1 from partner_links pl
      where pl.status = 'accepted'
        and ((pl.user_a = auth.uid() and pl.user_b = goals.user_id)
          or (pl.user_b = auth.uid() and pl.user_a = goals.user_id))
    )
  );

create policy "tasks المشتركة يشوفها الشريك المقبول" on tasks for select
  using (
    is_shared = true and exists (
      select 1 from partner_links pl
      where pl.status = 'accepted'
        and ((pl.user_a = auth.uid() and pl.user_b = tasks.user_id)
          or (pl.user_b = auth.uid() and pl.user_a = tasks.user_id))
    )
  );

-- ملحوظة أمان: مش بنعمل policy على جدول profiles نفسه للشريك، لنفس السبب فوق —
-- ده كان هيسمح للشريك يشوف بايو خاص أو بيانات تانية عن طريق استدعاء الـ API مباشرة.
-- بدل كده، فيه View آمن (partner_profiles) تحت بيوفّر بس الاسم والصورة.

-- ============================================================
-- المرحلة 2 (تكملة) — My World: موسيقى / أفلام / كتب / بودكاست / أماكن / هوايات
-- ============================================================
create table if not exists world_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  kind text not null, -- music | movie | show | podcast | book | place | hobby
  status text default 'favorite', -- favorite | watchlist | want_to_read | finished | visited | want_to_visit
  title text not null,
  subtitle text, -- فنان / مؤلف / بطولة ...
  rating int, -- 1-5 (اختياري)
  notes text,
  link_url text, -- رابط خارجي (يوتيوب، سبوتيفاي، جودريدز...)
  is_public boolean default false,
  created_at timestamptz default now()
);

alter table world_items enable row level security;
create policy "world_items خاصة بصاحبها" on world_items for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "world_items العامة تظهر لأي حد" on world_items for select
  using (is_public = true);

-- ============================================================
-- المرحلة 4 (تكملة) — مراجعة اليوم ومراجعة الأسبوع
-- ============================================================
create table if not exists evening_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  review_date date default current_date,
  accomplished text,
  proud_of text,
  created_at timestamptz default now(),
  unique (user_id, review_date)
);

alter table evening_reviews enable row level security;
create policy "evening_reviews خاصة بصاحبها" on evening_reviews for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  week_start date not null,
  tasks_completed int default 0,
  goals_achieved int default 0,
  best_streak text,
  focus_next text,
  created_at timestamptz default now(),
  unique (user_id, week_start)
);

alter table weekly_reviews enable row level security;
create policy "weekly_reviews خاصة بصاحبها" on weekly_reviews for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- المرحلة 5 — الذكريات (Timeline) والرسائل المفاجئة (Hidden Messages)
-- ============================================================
create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  year int not null,
  emoji text default '✨',
  title text not null,
  description text,
  image_url text,
  link_url text,
  created_at timestamptz default now()
);

alter table memories enable row level security;
create policy "memories خاصة بصاحبها" on memories for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists hidden_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  trigger_type text not null, -- days_after_join | specific_date | first_goal_done | manual
  trigger_value text, -- عدد الأيام أو التاريخ حسب النوع
  content text not null,
  is_delivered boolean default false,
  created_at timestamptz default now()
);

alter table hidden_messages enable row level security;
create policy "hidden_messages خاصة بصاحبها" on hidden_messages for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- تخزين الصور (Storage) — الصورة الشخصية وصور الذكريات
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('memory-photos', 'memory-photos', true)
on conflict (id) do nothing;

-- كل واحد يرفع ويعدّل بس داخل مجلد اسمه uid بتاعه (avatars/<uid>/...)
create policy "avatars يرفعها صاحبها بس" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars يعدّلها صاحبها بس" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars يمسحها صاحبها بس" on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars يشوفها أي حد (Bucket عام)" on storage.objects for select
  using (bucket_id = 'avatars');

create policy "memory-photos يرفعها صاحبها بس" on storage.objects for insert
  with check (bucket_id = 'memory-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "memory-photos يعدّلها صاحبها بس" on storage.objects for update
  using (bucket_id = 'memory-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "memory-photos يمسحها صاحبها بس" on storage.objects for delete
  using (bucket_id = 'memory-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "memory-photos يشوفها أي حد (Bucket عام)" on storage.objects for select
  using (bucket_id = 'memory-photos');

-- ============================================================
-- View آمن للصفحة العامة (/u/username) — بيوفّر بس الأعمدة المسموح تكون عامة،
-- والبايو بيترجع NULL لو صاحبه ما حددوش كـ عام. أي حد (حتى بدون تسجيل دخول)
-- يقدر يقرا الـ View ده، لكن أبدًا مش هيقدر يشوف الجدول الأصلي كامل.
-- ============================================================
create or replace view public_profiles as
select
  id,
  display_name,
  username,
  avatar_url,
  case when is_bio_public then bio else null end as bio
from profiles
where username is not null;

grant select on public_profiles to anon, authenticated;

-- View آمن تاني للشريك: بيوفّر بس اسم وصورة الطرف التاني اللي مرتبط بيه فعليًا
-- (اتحقق منه عن طريق auth.uid() جوه الـ View نفسه، مش عن طريق RLS على الجدول الأصلي)
create or replace view partner_profiles as
select
  p.id,
  p.display_name,
  p.avatar_url
from profiles p
where exists (
  select 1 from partner_links pl
  where pl.status in ('accepted', 'pending')
    and ((pl.user_a = auth.uid() and pl.user_b = p.id)
      or (pl.user_b = auth.uid() and pl.user_a = p.id))
);

grant select on partner_profiles to authenticated;
