"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import EmptyState from "./EmptyState";
import { Plus, Trash2, AlertTriangle } from "lucide-react";

const STATUS_COLOR = {
  open: "bg-red-500/15 text-red-500",
  investigating: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  waiting: "bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted",
  resolved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
};
const PRIORITY_COLOR = {
  low: "text-ink-muted dark:text-moon-muted",
  medium: "text-amber-600 dark:text-amber-400",
  high: "text-red-500",
};

export default function IssuesManager({ userId, initialIssues, orders, suppliers, strings }) {
  const supabase = createClient();
  const { confirm } = useConfirm();
  const s = strings.supplyChain;
  const [issues, setIssues] = useState(initialIssues || []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", cause: "", priority: "medium", order_id: "", supplier_id: "" });
  const [saving, setSaving] = useState(false);

  async function addIssue(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("supply_chain_issues")
      .insert({
        user_id: userId,
        title: form.title.trim(),
        cause: form.cause.trim() || null,
        priority: form.priority,
        order_id: form.order_id || null,
        supplier_id: form.supplier_id || null,
      })
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      setIssues((list) => [data, ...list]);
      setForm({ title: "", cause: "", priority: "medium", order_id: "", supplier_id: "" });
      setOpen(false);
    }
  }

  async function cycleStatus(issue) {
    const order = ["open", "investigating", "waiting", "resolved"];
    const next = order[(order.indexOf(issue.status) + 1) % order.length];
    await supabase.from("supply_chain_issues").update({ status: next }).eq("id", issue.id);
    setIssues((list) => list.map((i) => (i.id === issue.id ? { ...i, status: next } : i)));
  }

  async function removeIssue(id) {
    if (!(await confirm(s.confirmDeleteIssue))) return;
    await supabase.from("supply_chain_issues").delete().eq("id", id);
    setIssues((list) => list.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-3">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="w-full ops-card ops-card-hover p-4 flex items-center justify-center gap-2 text-sm text-ink-muted dark:text-moon-muted hover:text-sky-500 transition">
          <Plus size={15} strokeWidth={2} />
          {s.addIssue}
        </button>
      ) : (
        <form onSubmit={addIssue} className="ops-card p-4 space-y-2">
          <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={s.issueTitle}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500" />
          <textarea value={form.cause} onChange={(e) => setForm({ ...form, cause: e.target.value })}
            placeholder={s.cause} rows={2}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500 resize-none" />
          <div className="flex gap-2 flex-wrap">
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500">
              {Object.entries(s.priorityLevels).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <select value={form.order_id} onChange={(e) => setForm({ ...form, order_id: e.target.value })}
              className="flex-1 min-w-[140px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sky-500">
              <option value="">{s.noOrder}</option>
              {orders.map((o) => <option key={o.id} value={o.id}>{o.items}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" disabled={saving || !form.title.trim()}
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

      {issues.length === 0 && !open && (
        <EmptyState icon={AlertTriangle} title={s.noIssues} actionLabel={s.addIssue} onAction={() => setOpen(true)} tone="sky" />
      )}

      <div className="space-y-2">
        {issues.map((issue) => (
          <div key={issue.id} className="ops-card ops-card-hover p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-500 shrink-0">
                <AlertTriangle size={15} strokeWidth={2} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium">{issue.title}</p>
                  <span className={`text-[10px] font-medium ${PRIORITY_COLOR[issue.priority]}`}>
                    {s.priorityLevels[issue.priority]}
                  </span>
                </div>
                {issue.cause && <p className="text-xs text-ink-muted dark:text-moon-muted mt-1">{issue.cause}</p>}
              </div>
              <button onClick={() => cycleStatus(issue)}
                className={`shrink-0 text-xs rounded-full px-2.5 py-1 font-medium transition ${STATUS_COLOR[issue.status] || STATUS_COLOR.open}`}>
                {s.issueStatus[issue.status] || s.issueStatus.open}
              </button>
              <button onClick={() => removeIssue(issue.id)} aria-label={s.delete}
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
