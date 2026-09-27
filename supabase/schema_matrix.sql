-- ============================================================
-- Personal World — Eisenhower Matrix
-- شغّلي هذا الملف في: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

alter table tasks add column if not exists quadrant text;
-- do_first | schedule | delegate | eliminate | null (لسه مش متصنّفة)

create index if not exists tasks_quadrant_idx on tasks(quadrant);
