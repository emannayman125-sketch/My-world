-- ============================================================
-- شغّليها في: Supabase Dashboard -> SQL Editor -> New query -> Run
-- (بعد ما تكوني شغّلتي 002 و003 و004 قبل كده). آمنة تتشغّل أكتر من مرة.
-- ============================================================

-- كل طلب ممكن يتربط بمشروع (زي جهات الاتصال بالظبط)، عشان صفحة المشروع
-- تجمع كل حاجة تخصه في مكان واحد بدل ما تكون متفرقة.
alter table supply_chain_orders add column if not exists project_id uuid references business_projects(id) on delete set null;

create index if not exists supply_chain_orders_project_id_idx on supply_chain_orders(project_id);
