"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";

export default function MessagesManager({ userId, initialMessages, strings }) {
  const tr = strings.legacy.messages;
  const TRIGGERS = {
    days_after_join: { label: tr.triggers.days_after_join, placeholder: tr.daysPlaceholder },
    specific_date: { label: tr.triggers.specific_date, placeholder: tr.datePlaceholder },
    first_goal_done: { label: tr.triggers.first_goal_done, placeholder: "" },
    manual: { label: tr.triggers.manual, placeholder: "" },
  };
  const { confirm } = useConfirm();
  const supabase = createClient();
  const [messages, setMessages] = useState(initialMessages || []);
  const [form, setForm] = useState({ trigger_type: "days_after_join", trigger_value: "", content: "" });

  async function addMessage(e) {
    e.preventDefault();
    if (!form.content.trim()) return;

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

  return (
    <div className="space-y-4">
      <form onSubmit={addMessage} className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <select
            value={form.trigger_type}
            onChange={(e) => setForm({ ...form, trigger_type: e.target.value, trigger_value: "" })}
            className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-2 py-2 text-sm outline-none focus:border-lantern"
          >
            {Object.entries(TRIGGERS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          {TRIGGERS[form.trigger_type].placeholder && (
            <input
              value={form.trigger_value}
              onChange={(e) => setForm({ ...form, trigger_value: e.target.value })}
              placeholder={TRIGGERS[form.trigger_type].placeholder}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-lantern w-40"
            />
          )}
        </div>
        <textarea
          rows={3}
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          placeholder={tr.contentPlaceholder}
          className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-lantern"
        />
        <div className="flex justify-end">
          <button type="submit" className="rounded-soft bg-lantern text-night text-sm px-5 py-2 hover:brightness-105">
            {tr.save}
          </button>
        </div>
      </form>

      <div className="space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="card p-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-ink-muted dark:text-moon-muted mb-1">
                {TRIGGERS[m.trigger_type]?.label} {m.trigger_value ? `— ${m.trigger_value}` : ""}
                {m.is_delivered && ` ${tr.delivered}`}
              </p>
              <p className="leading-7 whitespace-pre-wrap">{m.content}</p>
            </div>
            <button onClick={() => removeMessage(m.id)} className="text-ink-muted dark:text-moon-muted hover:text-red-500 text-sm shrink-0">
              {tr.delete}
            </button>
          </div>
        ))}

        {messages.length === 0 && (
          <p className="text-sm text-ink-muted dark:text-moon-muted">{tr.noMessages}</p>
        )}
      </div>
    </div>
  );
}
