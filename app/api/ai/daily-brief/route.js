import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabaseServer";
import { callGemini } from "@/lib/ai/gemini";
import { todayISO, addDaysISO } from "@/lib/time";

export const dynamic = "force-dynamic";

// Daily Brief: Hamzawi's short "here's your day" card for the Home page.
//
// Principles (same as the rest of the app):
//  - It only READS data and writes a cached copy of the brief. It never creates
//    tasks. The client shows suggestions and Ahmed decides what to add.
//  - Journal entries are never read or sent to the AI.
//  - If the AI is unavailable, a plain rule-based brief is returned instead,
//    so the card always works.

const RANK = { high: 0, important: 1, normal: 2 };
const CACHE_KIND = "daily_brief";

// A failed query must never break the brief; it just contributes nothing.
async function safe(builder) {
  try {
    const r = await builder;
    return r?.data || [];
  } catch {
    return [];
  }
}

async function gatherFacts(supabase, userId, today) {
  const weekAhead = addDaysISO(7);

  const [tasks, top3, events, habits, habitLogs, moods, assignments, orders] = await Promise.all([
    safe(supabase.from("tasks").select("title, priority, due_date").eq("user_id", userId).eq("is_done", false).limit(60)),
    safe(supabase.from("top3_tasks").select("title, is_done").eq("user_id", userId).eq("for_date", today)),
    safe(supabase.from("events").select("title, event_time, category").eq("user_id", userId).eq("event_date", today).order("event_time", { ascending: true })),
    safe(supabase.from("habits").select("id").eq("user_id", userId)),
    safe(supabase.from("habit_logs").select("habit_id").eq("user_id", userId).eq("done_date", today)),
    safe(supabase.from("daily_moods").select("mood").eq("user_id", userId).eq("mood_date", today).limit(1)),
    safe(
      supabase
        .from("mba_assignments")
        .select("title, due_date, status")
        .eq("user_id", userId)
        .not("status", "in", "(completed,submitted)")
        .lte("due_date", weekAhead)
        .order("due_date", { ascending: true })
        .limit(8)
    ),
    safe(
      supabase
        .from("supply_chain_orders")
        .select("customer, items, status, expected_delivery")
        .eq("user_id", userId)
        .not("status", "in", "(delivered,arrived,cancelled,draft)")
        .limit(30)
    ),
  ]);

  const sortedTasks = [...tasks].sort((a, b) => {
    const pr = (RANK[a.priority] ?? 2) - (RANK[b.priority] ?? 2);
    if (pr !== 0) return pr;
    return (a.due_date || "9999").localeCompare(b.due_date || "9999");
  });

  const delayedOrders = orders.filter(
    (o) => o.status === "delayed" || (o.expected_delivery && o.expected_delivery < today)
  );

  return {
    today,
    mood: moods[0]?.mood || null,
    openTasks: sortedTasks.slice(0, 10).map((t) => ({
      title: t.title,
      priority: t.priority,
      due: t.due_date || null,
      overdue: !!(t.due_date && t.due_date < today),
    })),
    openTaskCount: tasks.length,
    overdueCount: tasks.filter((t) => t.due_date && t.due_date < today).length,
    dueTodayCount: tasks.filter((t) => t.due_date === today).length,
    top3: top3.map((t) => ({ title: t.title, done: t.is_done })),
    events: events.map((e) => ({ title: e.title, time: e.event_time ? String(e.event_time).slice(0, 5) : null })),
    habits: { total: habits.length, doneToday: habitLogs.length },
    assignmentsDueSoon: assignments.map((a) => ({ title: a.title, due: a.due_date, status: a.status })),
    delayedOrders: delayedOrders.slice(0, 5).map((o) => ({
      what: o.items || o.customer || "order",
      expected: o.expected_delivery || null,
    })),
    delayedOrderCount: delayedOrders.length,
  };
}

// Rule-based brief: used when there's no AI key, the AI errors, or its JSON is unusable.
function fallbackBrief(facts, locale) {
  const ar = locale === "ar";
  const focus = [];

  for (const t of facts.openTasks.filter((x) => x.overdue).slice(0, 2)) {
    focus.push({ title: t.title, why: ar ? "متأخرة" : "overdue" });
  }
  for (const a of facts.assignmentsDueSoon.slice(0, 2)) {
    if (focus.length >= 3) break;
    focus.push({ title: a.title, why: ar ? `تسليم ${a.due}` : `due ${a.due}` });
  }
  for (const t of facts.openTasks) {
    if (focus.length >= 3) break;
    if (!focus.some((f) => f.title === t.title)) focus.push({ title: t.title, why: t.due ? (ar ? `ميعادها ${t.due}` : `due ${t.due}`) : (ar ? "أولوية عالية" : "high priority") });
  }
  if (facts.mood === "tired" || facts.mood === "rough") focus.splice(2);

  const n = facts.openTaskCount + facts.events.length;
  let headline;
  if (n === 0 && facts.assignmentsDueSoon.length === 0) {
    headline = ar ? "يومك فاضي لحد دلوقتي. تحب نبدأ بحاجة صغيرة؟" : "Your day is open so far. Want to start with something small?";
  } else {
    headline = ar
      ? `المهام المفتوحة: ${facts.openTaskCount}، ومواعيد النهارده: ${facts.events.length}.`
      : `Open tasks: ${facts.openTaskCount}, events today: ${facts.events.length}.`;
  }
  if (facts.delayedOrderCount > 0) {
    headline += ar ? ` طلبات متأخرة: ${facts.delayedOrderCount}.` : ` Delayed orders: ${facts.delayedOrderCount}.`;
  }

  const note =
    facts.mood === "tired" || facts.mood === "rough"
      ? ar ? "النهارده خفيف علينا. حاجة واحدة كفاية." : "Go easy today. One thing is enough."
      : ar ? "خطوة واحدة في المرة." : "One step at a time.";

  return { headline, focus, note };
}

function sanitize(raw, maxFocus) {
  const clip = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);
  const headline = clip(raw?.headline, 140);
  if (!headline) return null;
  const focus = Array.isArray(raw?.focus)
    ? raw.focus
        .map((f) => ({ title: clip(f?.title, 90), why: clip(f?.why, 70) }))
        .filter((f) => f.title)
        .slice(0, maxFocus)
    : [];
  return { headline, focus, note: clip(raw?.note, 150) };
}

async function aiBrief(facts, locale) {
  const ar = locale === "ar";
  const lowEnergy = facts.mood === "tired" || facts.mood === "rough";
  const maxFocus = lowEnergy ? 2 : 3;

  const system = `You are Hamzawi, the warm personal assistant inside Ahmed's private app. Write his briefing for today.

Language: ${ar ? "natural, friendly Egyptian Arabic, short sentences" : "plain, warm English"}.

Return ONLY valid JSON (no markdown fences, no extra text):
{"headline": string, "focus": [{"title": string, "why": string}], "note": string}

Rules:
- headline: ONE sentence, max 110 characters, describing what today looks like using real numbers from the data. Do not greet him (the app already does).
- focus: at most ${maxFocus} items (fewer or none if there is genuinely little to do). Each "title" must be something concrete he can do today, taken from his real tasks, assignments, events or delayed orders (you may shorten the wording). NEVER invent tasks, meetings, deadlines or numbers. "why" is max 60 characters, e.g. overdue, due today, order is late.
- Mood is "${facts.mood || "unknown"}". If tired or rough: keep it light and gentle, fewer items. If energized: one bigger item is fine.
- note: max 110 characters, one warm human line. No medical, religious, or financial/investment advice. Never suggest trades.
- Plain text only inside strings: no emojis, no markdown, no lists.`;

  const res = await callGemini(system, [{ role: "user", content: JSON.stringify(facts) }], {
    jsonMode: true,
    maxTokens: 2048,
  });
  if (!res || res.error || !res.text) return null;

  try {
    const cleaned = res.text.replace(/```json|```/g, "").trim();
    return sanitize(JSON.parse(cleaned), maxFocus);
  } catch {
    return null;
  }
}

export async function GET(request) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") === "en" ? "en" : "ar";
  const refresh = url.searchParams.get("refresh") === "1";
  const today = todayISO();

  // Cached copy for today (so opening Home ten times costs one AI call).
  let cached = null;
  try {
    const { data } = await supabase
      .from("notes")
      .select("content")
      .eq("user_id", user.id)
      .eq("kind", CACHE_KIND)
      .order("created_at", { ascending: false })
      .limit(1);
    if (data?.[0]?.content) {
      const parsed = JSON.parse(data[0].content);
      if (parsed.date === today && parsed.locale === locale) cached = parsed;
    }
  } catch {}

  // A refresh inside 60 seconds of the last generation just returns the cached copy.
  if (cached && (!refresh || Date.now() - (cached.generatedAt || 0) < 60_000)) {
    return NextResponse.json({ brief: cached.brief, source: cached.source, cached: true });
  }

  const facts = await gatherFacts(supabase, user.id, today);
  let brief = await aiBrief(facts, locale);
  let source = "ai";
  if (!brief) {
    brief = fallbackBrief(facts, locale);
    source = "fallback";
  }

  try {
    await supabase.from("notes").insert({
      user_id: user.id,
      kind: CACHE_KIND,
      content: JSON.stringify({ date: today, locale, brief, source, generatedAt: Date.now() }),
    });
    // Keep the table tidy: drop cached briefs older than 3 days.
    await supabase
      .from("notes")
      .delete()
      .eq("user_id", user.id)
      .eq("kind", CACHE_KIND)
      .lt("created_at", new Date(Date.now() - 3 * 86400000).toISOString());
  } catch {}

  return NextResponse.json({ brief, source, cached: false });
}
