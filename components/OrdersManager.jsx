"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import EmptyState from "./EmptyState";
import { Plus, Trash2, Package } from "lucide-react";
import { todayISO } from "@/lib/time";

const STATUS_ORDER = ["draft", "placed", "confirmed", "prepared", "shipped", "in_transit", "arrived", "delivered"];
const STATUS_COLOR = {
  draft: "bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted",
  placed: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  confirmed: "bg-sky-500/20 text-sky-600 dark:text-sky-400",
  prepared: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  shipped: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
  in_transit: "bg-violet-500/15 text-violet-500",
  arrived: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  delivered: "bg-emerald-500/25 text-emerald-600 dark:text-emerald-400",
  delayed: "bg-red-500/15 text-red-500",
  cancelled: "bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted line-through",
};

export default function OrdersManager({ userId, initialOrders, suppliers, strings, projects = [], defaultProjectId = "" }) {
  const supabase = createClient();
  const { confirm } = useConfirm();
  const s = strings.supplyChain;
  const [orders, setOrders] = useState(initialOrders || []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer: "", items: "", quantity: "", supplier_id: "", expected_delivery: "", project_id: defaultProjectId });
  const [saving, setSaving] = useState(false);

  async function addOrder(e) {
    e.preventDefault();
    if (!form.items.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("supply_chain_orders")
      .insert({
        user_id: userId,
        customer: form.customer.trim() || null,
        items: form.items.trim(),
        quantity: form.quantity.trim() || null,
        supplier_id: form.supplier_id || null,
        project_id: form.project_id || null,
        expected_delivery: form.expected_delivery || null,
        order_date: todayISO(),
      })
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      setOrders((list) => [data, ...list]);
      setForm({ customer: "", items: "", quantity: "", supplier_id: "", expected_delivery: "", project_id: defaultProjectId });
      setOpen(false);
    }
  }

  async function cycleStatus(order) {
    const idx = STATUS_ORDER.indexOf(order.status);
    const next = idx === -1 ? "draft" : STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    await supabase.from("supply_chain_orders").update({ status: next }).eq("id", order.id);
    setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
  }

  async function markDelayed(order) {
    const next = order.status === "delayed" ? "in_transit" : "delayed";
    await supabase.from("supply_chain_orders").update({ status: next }).eq("id", order.id);
    setOrders((list) => list.map((o) => (o.id === order.id ? { ...o, status: next } : o)));
  }

  async function removeOrder(id) {
    if (!(await confirm(s.confirmDeleteOrder))) return;
    await supabase.from("supply_chain_orders").delete().eq("id", id);
    setOrders((list) => list.filter((o) => o.id !== id));
  }

  function supplierName(id) {
    return suppliers.find((sp) => sp.id === id)?.name;
  }

  function projectName(id) {
    return projects.find((p) => p.id === id)?.name;
  }

  return (
    <div className="space-y-3">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="w-full ops-card ops-card-hover p-4 flex items-center justify-center gap-2 text-sm text-ink-muted dark:text-moon-muted hover:text-sky-500 transition">
          <Plus size={15} strokeWidth={2} />
          {s.addOrder}
        </button>
      ) : (
        <form onSubmit={addOrder} className="ops-card p-4 space-y-2">
          <input autoFocus value={form.items} onChange={(e) => setForm({ ...form, items: e.target.value })}
            placeholder={s.items}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500" />
          <div className="flex gap-2 flex-wrap">
            <input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })}
              placeholder={s.customer}
              className="flex-1 min-w-[120px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500" />
            <input value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder={s.quantity}
              className="w-28 rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
              className="flex-1 min-w-[140px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500">
              <option value="">{s.noSupplier}</option>
              {suppliers.map((sp) => <option key={sp.id} value={sp.id}>{sp.name}</option>)}
            </select>
            {projects.length > 1 && (
              <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                className="flex-1 min-w-[140px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500">
                <option value="">{s.noProject}</option>
                {projects.map((pr) => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
              </select>
            )}
            <input type="date" value={form.expected_delivery} onChange={(e) => setForm({ ...form, expected_delivery: e.target.value })}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500" />
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" disabled={saving || !form.items.trim()}
              className="rounded-soft bg-sky-600 text-white text-sm font-medium px-4 py-2 hover:brightness-110 transition disabled:opacity-50">
              {saving ? s.saving : s.save}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="text-sm text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon">
              {strings.quote.cancel}
            </button>
          </div>
        </form>
      )}

      {orders.length === 0 && !open && (
        <EmptyState icon={Package} title={s.noOrders} actionLabel={s.addOrder} onAction={() => setOpen(true)} tone="sky" />
      )}

      <div className="space-y-2">
        {orders.map((o) => (
          <div key={o.id} className="ops-card ops-card-hover p-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 shrink-0">
                <Package size={15} strokeWidth={2} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{o.items}{o.quantity && ` · ${o.quantity}`}</p>
                <p className="text-xs text-ink-muted dark:text-moon-muted">
                  {supplierName(o.supplier_id) || s.noSupplier}
                  {o.customer && ` · ${o.customer}`}
                  {projects.length > 1 && o.project_id && ` · 🏗️ ${projectName(o.project_id) || ""}`}
                  {o.expected_delivery && ` · ${s.expectedDelivery}: ${o.expected_delivery}`}
                </p>
              </div>
              <button onClick={() => cycleStatus(o)}
                className={`shrink-0 text-xs rounded-full px-2.5 py-1 font-medium transition ${STATUS_COLOR[o.status] || STATUS_COLOR.draft}`}>
                {s.status[o.status] || s.status.draft}
              </button>
              <button onClick={() => markDelayed(o)}
                className={`shrink-0 text-[10px] rounded-full px-2 py-1 border transition ${o.status === "delayed" ? "border-red-500 text-red-500" : "border-black/10 dark:border-white/10 text-ink-muted dark:text-moon-muted hover:border-red-500 hover:text-red-500"}`}>
                {s.status.delayed}
              </button>
              <button onClick={() => removeOrder(o.id)} aria-label={s.delete}
                className="text-ink-muted/60 hover:text-red-500 transition shrink-0">
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
