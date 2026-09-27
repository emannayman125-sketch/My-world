-- ============================================================
-- Personal World — Library (رفع وقراءة الكتب/PDFs)
-- شغّلي هذا الملف في: Supabase Dashboard -> SQL Editor -> New query
-- (بعد ما يكون schema.sql الأساسي شغال بالفعل)
-- ============================================================

-- ---------- جدول الكتب ----------
create table if not exists library_books (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  author text,
  category text default 'want_to_read',
  -- currently_reading | want_to_read | finished | mba | research | business | personal_development
  file_path text,        -- المسار جوه bucket "library"
  cover_path text,       -- المسار جوه bucket "library-covers" (اختياري)
  progress int default 0, -- 0-100
  rating int,             -- 1-5, اختياري
  notes text,
  research_id uuid references research_projects(id) on delete set null,
  course_id uuid references mba_courses(id) on delete set null,
  created_at timestamptz default now()
);

alter table library_books enable row level security;
create policy "library_books خاصة بصاحبها" on library_books for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Storage buckets ----------
-- baskets خاصة (مش public) — الوصول بس عن طريق signed URLs بعد التحقق من RLS تحت.
insert into storage.buckets (id, name, public)
values ('library', 'library', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('library-covers', 'library-covers', false)
on conflict (id) do nothing;

-- كل ملف بيتحفظ تحت مسار "{user_id}/filename.pdf"، فالـ policy بتتأكد إن
-- أول جزء من المسار (folder) يطابق الـ uid بتاع صاحب الطلب.
create policy "library: قراءة ملفات الشخص نفسه"
  on storage.objects for select
  using (bucket_id = 'library' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "library: رفع ملفات الشخص نفسه"
  on storage.objects for insert
  with check (bucket_id = 'library' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "library: حذف ملفات الشخص نفسه"
  on storage.objects for delete
  using (bucket_id = 'library' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "library-covers: قراءة صور الشخص نفسه"
  on storage.objects for select
  using (bucket_id = 'library-covers' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "library-covers: رفع صور الشخص نفسه"
  on storage.objects for insert
  with check (bucket_id = 'library-covers' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "library-covers: حذف صور الشخص نفسه"
  on storage.objects for delete
  using (bucket_id = 'library-covers' and (storage.foldername(name))[1] = auth.uid()::text);

create index if not exists library_books_category_idx on library_books(category);
