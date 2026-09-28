"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";

export default function MessagesManager({ userId, initialMessages, strings }) {
  const tr = strings.legacy.messages;
  // inputType: how the value is entered. `needsValue` blocks saving until it's valid,
  // so a typo can never make a message fire on the wrong day.
  const TRIGGERS = {
    days_after_join: { label: tr.triggers.days_after_join, placeholder: tr.daysPlaceholder, inputType: "number", min: 0, needsValue: true },
    specific_date: { label: tr.triggers.specific_date, placeholder: tr.datePlaceholder, inputType: "date", needsValue: true },
    first_goal_done: { label: tr.triggers.first_goal_done, placeholder: "" },
    tasks_done: { label: tr.triggers.tasks_done, placeholder: tr.tasksPlaceholder, inputType: "number", needsValue: true },
    habit_streak: { label: tr.triggers.habit_streak, placeholder: tr.streakPlaceholder, inputType: "number", needsValue: true },
    anytime: { label: tr.triggers.anytime, placeholder: "" },
    manual: { label: tr.triggers.manual, placeholder: "" },
  };
  const valueOk = (type, v) => {
    const t = TRIGGERS[type];
    if (!t.needsValue) return true;
    if (t.inputType === "date") return /^\d{4}-\d{2}-\d{2}$/.test(v || "");
    const n = Number(v);
    return String(v ?? "").trim() !== "" && Number.isInteger(n) && n >= (t.min ?? 1);
  };
  const { confirm } = useConfirm();
  const supabase = createClient();
  const [messages, setMessages] = useState(initialMessages || []);
  const [form, setForm] = useState({ trigger_type: "days_after_join", trigger_value: "", content: "" });
  const [revealed, setRevealed] = useState([]); // ids of sealed messages currently shown
  const [valueError, setValueError] = useState(false);

  async function addMessage(e) {
    e.preventDefault();
    if (!form.content.trim()) return;
    if (!valueOk(form.trigger_type, form.trigger_value)) {
      setValueError(true);
      return;
    }
    setValueError(false);

    const { data, error } = await supabase
      .from("hidden_messages")
      .insert({
        user_id: userId,
        trigger_type: form.trigger_type,
        trigger_value: form.trigger_value || null,
        content: form.content.trim(),
      })
      .select()
      .single();

    if (!error && data) {
      setMessages((list) => [data, ...list]);
      setForm({ trigger_type: form.trigger_type, trigger_value: "", content: "" });
    }
  }

  async function removeMessage(id) {
    if (!(await confirm(tr.confirmDelete))) return;
    await supabase.from("hidden_messages").delete().eq("id", id);
    setMessages((list) => list.filter((m) => m.id !== id));
  }

  const waiting = messages.filter((m) => !m.is_delivered);
  const opened = messages.filter((m) => m.is_delivered);

  return (
    <div className="space-y-4">
      <form onSubmit={addMessage} className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <select
            value={form.trigger_type}
            onChange={(e) => setForm({ ...form, trigger_type: e.target.value, trigger_value: "" })}
            className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-2 py-2 text-sm outline-none focus:border-sage"
          >
            {Object.entries(TRIGGERS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          {TRIGGERS[form.trigger_type].inputType && (
            <input
              type={TRIGGERS[form.trigger_type].inputType}
              min={TRIGGERS[form.trigger_type].inputType === "number" ? (TRIGGERS[form.trigger_type].min ?? 1) : undefined}
              value={form.trigger_value}
              onChange={(e) => setForm({ ...form, trigger_value: e.target.value })}
              placeholder={TRIGGERS[form.trigger_type].placeholder}
              aria-label={TRIGGERS[form.trigger_type].placeholder}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage w-48"
            />
          )}
        </div>
        {valueError && <p className="text-xs text-red-500">{tr.needValue}</p>}
        <textarea
          rows={3}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          placeholder={tr.contentPlaceholder}
          className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-sage"
        />
        <div className="flex justify-end">
          <button type="submit" className="rounded-soft bg-lantern text-night text-sm px-5 py-2 hover:brightness-105">
            {tr.save}
          </button>
        </div>
      </form>

      {waiting.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium text-ink-muted dark:text-moon-muted">{tr.waitingTitle}</p>
          {waiting.map((m) => {
            const open = revealed.includes(m.id);
            return (
              <div key={m.id} className="card p-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-ink-muted dark:text-moon-muted mb-1">
                    {TRIGGERS[m.trigger_type]?.label} {m.trigger_value ? `— ${m.trigger_value}` : ""}
                  </p>
                  {open ? (
                    <p className="leading-7 whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <p className="text-sm text-sage dark:text-sage-soft">{tr.sealed}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setRevealed((r) => (open ? r.filter((id) => id !== m.id) : [...r, m.id]))}
                    className="mt-1.5 text-xs text-ink-muted dark:text-moon-muted hover:underline"
                  >
                    {open ? tr.hide : tr.reveal}
                  </button>
                </div>
                <button onClick={() => removeMessage(m.id)} className="text-ink-muted dark:text-moon-muted hover:text-red-500 text-sm shrink-0">
                  {tr.delete}
                </button>
              </div>
            );
          })}
        </section>
      )}

      {opened.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium text-ink-muted dark:text-moon-muted">{tr.archiveTitle}</p>
          {opened.map((m) => (
            <div key={m.id} className="card p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-ink-muted dark:text-moon-muted mb-1">
                  {TRIGGERS[m.trigger_type]?.label} {m.trigger_value ? `— ${m.trigger_value}` : ""}
                </p>
                <p className="leading-7 whitespace-pre-wrap">{m.content}</p>
              </div>
              <button onClick={() => removeMessage(m.id)} className="text-ink-muted dark:text-moon-muted hover:text-red-500 text-sm shrink-0">
                {tr.delete}
              </button>
            </div>
          ))}
        </section>
      )}

      {messages.length === 0 && (
        <p className="text-sm text-ink-muted dark:text-moon-muted">{tr.noMessages}</p>
      )}
    </div>
  );
}
