-- ============================================================
-- شغّليها في: Supabase Dashboard -> SQL Editor -> New query -> Run
-- (بعد ما تكوني شغّلتي 002 قبل كده). آمنة تتشغّل أكتر من مرة.
-- ============================================================

-- كل مادة (MBA أو معهد) بقى عندها "برنامج" يحددها، ونفس جدول المواد
-- بيتبع للاتنين عشان الكود يفضل واحد بدل ما نكرر كل حاجة.
alter table mba_courses add column if not exists program text not null default 'mba';
alter table mba_courses drop constraint if exists mba_courses_program_check;
alter table mba_courses add constraint mba_courses_program_check check (program in ('mba', 'institute'));

alter table research_projects add column if not exists program text not null default 'mba';
alter table research_projects drop constraint if exists research_projects_program_check;
alter table research_projects add constraint research_projects_program_check check (program in ('mba', 'institute'));

-- مادة معهد ممكن يختار صاحبها يشاركها مع شريكه (بيشوف اسمها وميعادها وتسليماتها بس).
alter table mba_courses add column if not exists is_shared boolean default false;

-- الشريك المقبول يشوف مادة المعهد اللي اتحددت كـ "مشتركة" بس
drop policy if exists "mba_courses المشتركة يشوفها الشريك المقبول" on mba_courses;
create policy "mba_courses المشتركة يشوفها الشريك المقبول" on mba_courses for select
  using (
    is_shared = true and exists (
      select 1 from partner_links pl
      where pl.status = 'accepted'
        and ((pl.user_a = auth.uid() and pl.user_b = mba_courses.user_id)
          or (pl.user_b = auth.uid() and pl.user_a = mba_courses.user_id))
    )
  );

-- وتسليمات نفس المادة المشتركة (مش عمود جديد — بتتبع مادتها)
drop policy if exists "mba_assignments بتتبع مشاركة مادتها" on mba_assignments;
create policy "mba_assignments بتتبع مشاركة مادتها" on mba_assignments for select
  using (
    exists (
      select 1 from mba_courses c
      join partner_links pl on pl.status = 'accepted'
        and ((pl.user_a = auth.uid() and pl.user_b = c.user_id)
          or (pl.user_b = auth.uid() and pl.user_a = c.user_id))
      where c.id = mba_assignments.course_id and c.is_shared = true
    )
  );
