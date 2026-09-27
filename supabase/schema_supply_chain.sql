-- ============================================================
-- Personal World — Supply Chain Hub (شغل أحمد الأساسي)
-- شغّلي هذا الملف في: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- ---------- الموردين ----------
create table if not exists supply_chain_suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  contact text,
  category text,
  products_services text,
  performance_notes text,
  last_contact date,
  next_followup date,
  created_at timestamptz default now()
);

alter table supply_chain_suppliers enable row level security;
create policy "supply_chain_suppliers خاصة بصاحبها" on supply_chain_suppliers for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- الطلبات (بيدمج مراحل الشحن جوه نفس الحالة) ----------
create table if not exists supply_chain_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  supplier_id uuid references supply_chain_suppliers(id) on delete set null,
  customer text,
  items text,
  quantity text,
  status text default 'draft',
  -- draft | placed | confirmed | prepared | shipped | in_transit | arrived | delivered | delayed | cancelled
  order_date date,
  expected_delivery date,
  actual_delivery date,
  notes text,
  created_at timestamptz default now()
);

alter table supply_chain_orders enable row level security;
create policy "supply_chain_orders خاصة بصاحبها" on supply_chain_orders for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- المشاكل والتأخيرات ----------
create table if not exists supply_chain_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  cause text,
  order_id uuid references supply_chain_orders(id) on delete set null,
  supplier_id uuid references supply_chain_suppliers(id) on delete set null,
  priority text default 'medium', -- low | medium | high
  status text default 'open',      -- open | investigating | waiting | resolved
  owner text,
  action text,
  deadline date,
  notes text,
  created_at timestamptz default now()
);

alter table supply_chain_issues enable row level security;
create policy "supply_chain_issues خاصة بصاحبها" on supply_chain_issues for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists supply_chain_orders_status_idx on supply_chain_orders(status);
create index if not exists supply_chain_orders_supplier_idx on supply_chain_orders(supplier_id);
create index if not exists supply_chain_issues_status_idx on supply_chain_issues(status);
