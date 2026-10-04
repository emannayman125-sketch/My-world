"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";

const TABLES = [
  "profiles", "top3_tasks", "tasks", "events", "habits", "habit_logs",
  "goals", "notes", "currently_items", "interests", "world_items",
  "evening_reviews", "weekly_reviews", "memories", "hidden_messages",
  "daily_moods", "english_sessions",
  "mba_courses", "mba_assignments", "research_projects", "research_notes",
  "library_books", "quran_portions", "quran_events",
  "trading_watchlist", "trading_journal", "trading_sessions", "trading_day_notes",
  "business_projects", "business_contacts", "business_ideas",
  "supply_chain_suppliers", "supply_chain_orders", "supply_chain_issues",
  "content_items", "time_capsules",
];

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toMarkdown(backup) {
  const lines = ["# عالمي — نسخة كاملة", ""];
  const profile = backup.profiles?.[0];

  if (profile) {
    lines.push(`## ${profile.display_name || "صديقي"}`, "");
    if (profile.bio) lines.push(profile.bio, "");
  }

  if (backup.interests?.length) {
    lines.push("## ❤️ الاهتمامات", "");
    for (const i of backup.interests) lines.push(`- **${i.category}**: ${i.value}`);
    lines.push("");
  }

  if (backup.world_items?.length) {
    lines.push("## 🎧 عالمي (موسيقى، أفلام، كتب...)", "");
    for (const w of backup.world_items) {
      lines.push(`- [${w.kind}] ${w.title}${w.subtitle ? ` — ${w.subtitle}` : ""} (${w.status})`);
    }
    lines.push("");
  }

  if (backup.tasks?.length) {
    lines.push("## ✅ المهام", "");
    for (const t of backup.tasks) lines.push(`- [${t.is_done ? "x" : " "}] ${t.title}${t.due_date ? ` (${t.due_date})` : ""}`);
    lines.push("");
  }

  if (backup.events?.length) {
    lines.push("## 📅 المواعيد", "");
    for (const e of backup.events) lines.push(`- ${e.event_date}${e.event_time ? " " + e.event_time : ""} — ${e.title} (${e.category})`);
    lines.push("");
  }

  if (backup.habits?.length) {
    lines.push("## 🔥 العادات", "");
    for (const h of backup.habits) lines.push(`- ${h.emoji} ${h.name} — Streak: ${h.current_streak}`);
    lines.push("");
  }

  if (backup.goals?.length) {
    lines.push("## 🏆 الأهداف", "");
    for (const g of backup.goals) lines.push(`- [${g.period}] ${g.title} — ${g.progress}%`);
    lines.push("");
  }

  if (backup.notes?.length) {
    lines.push("## 📝 اليوميات والملاحظات", "");
    for (const n of backup.notes) {
      lines.push(`### ${new Date(n.created_at).toLocaleDateString("ar-EG")} — ${n.kind}`, "", n.content, "");
    }
  }

  if (backup.memories?.length) {
    lines.push("## 🗺️ الذكريات", "");
    for (const m of backup.memories) lines.push(`- **${m.year}** ${m.emoji} ${m.title}${m.description ? ` — ${m.description}` : ""}`);
    lines.push("");
  }

  if (backup.mba_courses?.length) {
    lines.push("## 🎓 مواد MBA", "");
    for (const c of backup.mba_courses) lines.push(`- ${c.name}${c.professor ? ` — ${c.professor}` : ""}`);
    lines.push("");
  }

  if (backup.mba_assignments?.length) {
    lines.push("## 🎓 تسليمات MBA", "");
    for (const a of backup.mba_assignments) lines.push(`- [${a.status}] ${a.title}${a.due_date ? ` (${a.due_date})` : ""}`);
    lines.push("");
  }

  if (backup.research_projects?.length) {
    lines.push("## 🔬 الأبحاث", "");
    for (const r of backup.research_projects) lines.push(`- [${r.status}] ${r.title}${r.question ? ` — ${r.question}` : ""}`);
    lines.push("");
  }

  if (backup.library_books?.length) {
    lines.push("## 📚 المكتبة", "");
    for (const b of backup.library_books) lines.push(`- ${b.title}${b.author ? ` — ${b.author}` : ""} (${b.category})`);
    lines.push("");
  }

  if (backup.trading_journal?.length) {
    lines.push("## 📈 دفتر الصفقات", "");
    for (const t of backup.trading_journal) lines.push(`- ${t.symbol} — ${t.result}${t.pnl != null ? ` ($${t.pnl})` : ""}${t.trade_date ? ` — ${t.trade_date}` : ""}`);
    lines.push("");
  }

  if (backup.business_projects?.length) {
    lines.push("## 🏗️ مشاريع البيزنس", "");
    for (const p of backup.business_projects) lines.push(`- [${p.status}] ${p.name}${p.client ? ` — ${p.client}` : ""}`);
    lines.push("");
  }

  if (backup.business_ideas?.length) {
    lines.push("## 💡 أفكار البيزنس", "");
    for (const i of backup.business_ideas) lines.push(`- [${i.stage}] ${i.title}`);
    lines.push("");
  }

  if (backup.supply_chain_suppliers?.length) {
    lines.push("## 🚚 الموردين", "");
    for (const s of backup.supply_chain_suppliers) lines.push(`- ${s.name}${s.category ? ` (${s.category})` : ""}`);
    lines.push("");
  }

  if (backup.supply_chain_orders?.length) {
    lines.push("## 📦 طلبات سلسلة التوريد", "");
    for (const o of backup.supply_chain_orders) lines.push(`- [${o.status}] ${o.items}${o.customer ? ` — ${o.customer}` : ""}`);
    lines.push("");
  }

  if (backup.content_items?.length) {
    lines.push("## 🎙️ أفكار المحتوى", "");
    for (const c of backup.content_items) lines.push(`- [${c.status}] ${c.title} (${c.platform})`);
    lines.push("");
  }

  if (backup.time_capsules?.length) {
    lines.push("## ⏳ كبسولات الزمن", "");
    for (const c of backup.time_capsules) lines.push(`- تتفتح ${c.reveal_date}: ${c.message}`);
    lines.push("");
  }

  return lines.join("\n");
}

export default function BackupManager({ userId }) {
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function fetchAll() {
    const backup = {};
    for (const table of TABLES) {
      const idColumn = table === "profiles" ? "id" : "user_id";
      const { data } = await supabase.from(table).select("*").eq(idColumn, userId);
      backup[table] = data || [];
    }
    return backup;
  }

  async function exportJson() {
    setBusy(true);
    setStatus("");
    const backup = await fetchAll();
    downloadFile(
      JSON.stringify(backup, null, 2),
      `personal-world-backup-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json"
    );
    setBusy(false);
    setStatus("تم تنزيل نسخة JSON ✓");
  }

  async function exportMarkdown() {
    setBusy(true);
    setStatus("");
    const backup = await fetchAll();
    downloadFile(
      toMarkdown(backup),
      `personal-world-${new Date().toISOString().slice(0, 10)}.md`,
      "text/markdown"
    );
    setBusy(false);
    setStatus("تم تنزيل ملف Markdown ✓ — جاهز للاستيراد في Notion أو Obsidian أو أي أداة تانية");
  }

  async function importData(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus("");

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      for (const table of TABLES) {
        if (table === "profiles") continue; // البروفايل موجود بالفعل، بيتحدث من صفحة الإعدادات
        const rows = backup[table];
        if (Array.isArray(rows) && rows.length > 0) {
          const cleanRows = rows.map(({ id, ...rest }) => ({ ...rest, user_id: userId }));
          await supabase.from(table).insert(cleanRows);
        }
      }

      setStatus("تم استيراد البيانات ✓ (رفريش الصفحة عشان تشوفها)");
    } catch {
      setStatus("الملف غير صالح.");
    }

    setBusy(false);
    e.target.value = "";
  }

  return (
    <div className="card p-6 space-y-4">
      <h2 className="font-display text-xl">النسخ الاحتياطي والترحيل</h2>
      <p className="text-sm text-ink-muted dark:text-moon-muted">
        احتفظ بنسخة من كل بياناتك، استرجعها لو احتجت، أو صدّرها كملف Markdown عشان تنقلها لأي أداة تانية
        (Notion، Obsidian، أو حتى ملف نصي عادي) — البيانات دايمًا ملكك ومش حبيسة هنا.
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={exportJson}
          disabled={busy}
          className="rounded-soft bg-lantern text-night text-sm px-5 py-2 hover:brightness-105 disabled:opacity-50"
        >
          تصدير JSON (نسخة كاملة)
        </button>

        <button
          onClick={exportMarkdown}
          disabled={busy}
          className="rounded-soft bg-dusk text-white text-sm px-5 py-2 hover:brightness-105 disabled:opacity-50"
        >
          تصدير Markdown (للترحيل)
        </button>

        <label className="rounded-soft bg-black/5 dark:bg-white/5 text-sm px-5 py-2 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer">
          استيراد نسخة JSON
          <input type="file" accept="application/json" onChange={importData} className="hidden" disabled={busy} />
        </label>
      </div>

      {status && <p className="text-sm text-dusk">{status}</p>}
    </div>
  );
}
