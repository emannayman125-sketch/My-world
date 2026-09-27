"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import EmptyState from "./EmptyState";
import { Plus, Trash2, Truck } from "lucide-react";

export default function SuppliersManager({ userId, initialSuppliers, strings }) {
  const supabase = createClient();
  const { confirm } = useConfirm();
  const s = strings.supplyChain;
  const [suppliers, setSuppliers] = useState(initialSuppliers || []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", category: "", products_services: "", next_followup: "" });
  const [saving, setSaving] = useState(false);

  async function addSupplier(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("supply_chain_suppliers")
      .insert({
        user_id: userId,
        name: form.name.trim(),
        contact: form.contact.trim() || null,
        category: form.category.trim() || null,
        products_services: form.products_services.trim() || null,
        next_followup: form.next_followup || null,
      })
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      setSuppliers((list) => [data, ...list]);
      setForm({ name: "", contact: "", category: "", products_services: "", next_followup: "" });
      setOpen(false);
    }
  }

  async function removeSupplier(id) {
    if (!(await confirm(s.confirmDeleteSupplier))) return;
    await supabase.from("supply_chain_suppliers").delete().eq("id", id);
    setSuppliers((list) => list.filter((sup) => sup.id !== id));
  }

  return (
    <div className="space-y-4">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="w-full ops-card ops-card-hover p-4 flex items-center justify-center gap-2 text-sm text-ink-muted dark:text-moon-muted hover:text-sky-500 transition">
          <Plus size={15} strokeWidth={2} />
          {s.addSupplier}
        </button>
      ) : (
        <form onSubmit={addSupplier} className="ops-card p-4 space-y-2">
          <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={s.supplierName}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500" />
          <div className="flex gap-2 flex-wrap">
            <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })}
              placeholder={s.contact}
              className="flex-1 min-w-[140px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500" />
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder={s.category}
              className="flex-1 min-w-[120px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500" />
          </div>
          <input value={form.products_services} onChange={(e) => setForm({ ...form, products_services: e.target.value })}
            placeholder={s.productsServices}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500" />
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs text-ink-muted dark:text-moon-muted">{s.nextFollowup}</label>
            <input type="date" value={form.next_followup} onChange={(e) => setForm({ ...form, next_followup: e.target.value })}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500" />
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" disabled={saving || !form.name.trim()}
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

      {suppliers.length === 0 && !open && (
        <EmptyState icon={Truck} title={s.noSuppliers} actionLabel={s.addSupplier} onAction={() => setOpen(true)} tone="sky" />
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {suppliers.map((sup) => (
          <div key={sup.id} className="ops-card ops-card-hover p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 shrink-0">
                  <Truck size={15} strokeWidth={2} />
                </span>
                <div>
                  <h3 className="font-medium text-sm">{sup.name}</h3>
                  {sup.category && <p className="text-xs text-ink-muted dark:text-moon-muted">{sup.category}</p>}
                </div>
              </div>
              <button onClick={() => removeSupplier(sup.id)} aria-label={s.delete}
                className="text-ink-muted/60 hover:text-red-500 transition shrink-0">
                <Trash2 size={14} strokeWidth={2} />
              </button>
            </div>
            {sup.contact && <p className="text-xs text-ink-muted dark:text-moon-muted mt-2">{sup.contact}</p>}
            {sup.products_services && <p className="text-sm mt-2 leading-6">{sup.products_services}</p>}
            {sup.next_followup && (
              <p className="text-xs text-sky-600 dark:text-sky-400 mt-2">📅 {s.nextFollowup}: {sup.next_followup}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
