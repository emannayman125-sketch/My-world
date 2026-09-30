"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import EmptyState from "./EmptyState";
import { Plus, Trash2, User } from "lucide-react";

export default function ContactsManager({ userId, initialContacts, projects, strings, defaultProjectId = "" }) {
  const supabase = createClient();
  const { confirm } = useConfirm();
  const b = strings.business;
  const [contacts, setContacts] = useState(initialContacts || []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "client", phone: "", email: "", project_id: defaultProjectId });
  const [saving, setSaving] = useState(false);

  async function addContact(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("business_contacts")
      .insert({
        user_id: userId,
        name: form.name.trim(),
        type: form.type,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        project_id: form.project_id || null,
      })
      .select()
      .single();

    setSaving(false);
    if (!error && data) {
      setContacts((list) => [data, ...list]);
      setForm({ name: "", type: "client", phone: "", email: "", project_id: defaultProjectId });
      setOpen(false);
    }
  }

  async function removeContact(id) {
    if (!(await confirm(b.confirmDeleteContact))) return;
    await supabase.from("business_contacts").delete().eq("id", id);
    setContacts((list) => list.filter((c) => c.id !== id));
  }

  function projectName(id) {
    return projects.find((p) => p.id === id)?.name;
  }

  return (
    <div className="space-y-4">
      {!open ? (
        <button onClick={() => setOpen(true)}
          className="w-full exec-card exec-card-hover p-4 flex items-center justify-center gap-2 text-sm text-ink-muted dark:text-moon-muted hover:text-clay transition">
          <Plus size={15} strokeWidth={2} />
          {b.addContact}
        </button>
      ) : (
        <form onSubmit={addContact} className="exec-card p-4 space-y-2">
          <div className="flex gap-2 flex-wrap">
            <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={b.contactName}
              className="flex-1 min-w-[140px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-clay" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-clay">
              {Object.entries(b.type).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder={b.phone}
              className="flex-1 min-w-[120px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-clay" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={b.email}
              className="flex-1 min-w-[140px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-clay" />
          </div>
          {projects.length > 1 && (
            <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}
              className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-clay">
              <option value="">{b.noProject}</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <div className="flex items-center gap-2">
            <button type="submit" disabled={saving || !form.name.trim()}
              className="rounded-soft bg-clay text-white text-sm font-medium px-4 py-2 hover:brightness-105 transition disabled:opacity-50">
              {saving ? b.saving : b.save}
            </button>
            <button type="button" onClick={() => setOpen(false)}
              className="text-sm text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon">
              {strings.quote.cancel}
            </button>
          </div>
        </form>
      )}

      {contacts.length === 0 && !open && (
        <EmptyState icon={User} title={b.noContacts} actionLabel={b.addContact} onAction={() => setOpen(true)} tone="copper" />
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {contacts.map((c) => (
          <div key={c.id} className="exec-card exec-card-hover p-4 flex items-start gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-dusk/15 text-dusk shrink-0">
              <User size={15} strokeWidth={2} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <span className="text-[10px] rounded-full bg-black/5 dark:bg-white/10 px-1.5 py-0.5 text-ink-muted dark:text-moon-muted shrink-0">
                  {b.type[c.type] || b.type.other}
                </span>
              </div>
              {c.phone && <p className="text-xs text-ink-muted dark:text-moon-muted">{c.phone}</p>}
              {c.email && <p className="text-xs text-ink-muted dark:text-moon-muted">{c.email}</p>}
              {c.project_id && <p className="text-xs exec-accent mt-1">{projectName(c.project_id)}</p>}
            </div>
            <button onClick={() => removeContact(c.id)} aria-label={b.delete}
              className="text-ink-muted/60 hover:text-red-500 transition shrink-0">
              <Trash2 size={13} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
