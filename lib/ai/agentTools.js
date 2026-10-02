// The Agent's toolbox: real actions inside the app, each backed by the same
// tables the UI itself writes to. Deliberately excludes:
//   - anything outside the app (email, WhatsApp, calendar sync)
//   - the Journal, which the rest of the app also never lets any AI read or
//     write to (see Daily Brief) — that boundary stays consistent here
//   - any DELETE — the agent can only add, complete, or log; removing
//     something stays a manual action in the UI
import { todayISO, addDaysISO } from "@/lib/time";

const clip = (s, n) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

export const AGENT_TOOLS = [
  {
    name: "add_task",
    description: "Add a new task to his task list (not tied to a specific day).",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "The task, in his own words." },
        priority: { type: "STRING", enum: ["normal", "important", "high"] },
        due_date: { type: "STRING", description: "YYYY-MM-DD if a date was mentioned or implied, else omit." },
      },
      required: ["title"],
    },
  },
  {
    name: "complete_task",
    description: "Mark an existing open task as done, by matching its title.",
    parameters: {
      type: "OBJECT",
      properties: { title: { type: "STRING", description: "The task title or a close description of it." } },
      required: ["title"],
    },
  },
  {
    name: "add_to_today",
    description: "Add something to today's \"top 3\" focus list (max 3 items/day).",
    parameters: {
      type: "OBJECT",
      properties: { title: { type: "STRING" } },
      required: ["title"],
    },
  },
  {
    name: "add_habit",
    description: "Create a new daily habit to track.",
    parameters: {
      type: "OBJECT",
      properties: { name: { type: "STRING" }, emoji: { type: "STRING", description: "One fitting emoji." } },
      required: ["name"],
    },
  },
  {
    name: "log_habit_done",
    description: "Mark an existing habit as done for today, by matching its name.",
    parameters: {
      type: "OBJECT",
      properties: { name: { type: "STRING" } },
      required: ["name"],
    },
  },
  {
    name: "add_goal",
    description: "Add a weekly or monthly goal.",
    parameters: {
      type: "OBJECT",
      properties: { title: { type: "STRING" }, period: { type: "STRING", enum: ["weekly", "monthly"] } },
      required: ["title"],
    },
  },
  {
    name: "log_trade",
    description: "Log a trade in the trading journal (scalping quick-log).",
    parameters: {
      type: "OBJECT",
      properties: {
        symbol: { type: "STRING" },
        direction: { type: "STRING", enum: ["long", "short"] },
        result: { type: "STRING", enum: ["win", "loss", "breakeven", "open"] },
        pnl: { type: "NUMBER", description: "Profit or loss in dollars, negative for a loss." },
        fees: { type: "NUMBER" },
      },
      required: ["symbol", "result"],
    },
  },
  {
    name: "add_content_idea",
    description: "Add a new content idea to Creator Studio's pipeline.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        hook: { type: "STRING" },
        platform: { type: "STRING", enum: ["youtube", "podcast", "instagram", "tiktok", "linkedin", "other"] },
      },
      required: ["title"],
    },
  },
  {
    name: "add_world_item",
    description: "Add a book, movie, show, podcast, place, or hobby to \"My World\".",
    parameters: {
      type: "OBJECT",
      properties: {
        kind: { type: "STRING", enum: ["music", "movie", "show", "podcast", "book", "place", "hobby"] },
        title: { type: "STRING" },
        subtitle: { type: "STRING", description: "Artist/author/host/location, if mentioned." },
      },
      required: ["kind", "title"],
    },
  },
  {
    name: "add_business_idea",
    description: "Add a new business idea to think through later.",
    parameters: {
      type: "OBJECT",
      properties: { title: { type: "STRING" }, description: { type: "STRING" } },
      required: ["title"],
    },
  },
  {
    name: "list_reminders",
    description: "Get what he should keep in mind right now: open tasks, upcoming assignment deadlines, delayed orders. Use this whenever he asks what to remember, what's on his plate, or similar.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "summarize_today",
    description: "Get a factual summary of what actually happened today in the app: tasks completed, habits logged, trades, content ideas added. Use this when he asks what happened today / how his day went. Never includes journal content.",
    parameters: { type: "OBJECT", properties: {} },
  },
];

const WORLD_DEFAULT_STATUS = {
  music: "favorite", movie: "watchlist", show: "watchlist", podcast: "favorite",
  book: "want_to_read", place: "want_to_visit", hobby: "favorite",
};

/** Finds the best title match among a list of {id, title} rows. */
function matchByTitle(rows, query) {
  const q = clip(query, 200).toLowerCase();
  if (!q) return { match: null, candidates: [] };
  const exact = rows.filter((r) => r.title.toLowerCase() === q);
  if (exact.length === 1) return { match: exact[0], candidates: [] };
  const contains = rows.filter((r) => r.title.toLowerCase().includes(q) || q.includes(r.title.toLowerCase()));
  if (contains.length === 1) return { match: contains[0], candidates: [] };
  if (contains.length > 1) return { match: null, candidates: contains.map((r) => r.title) };
  return { match: null, candidates: [] };
}

/** Builds the executor for one user. Every action is scoped to userId via .eq(). */
export function makeAgentExecutor(supabase, userId) {
  const today = todayISO();

  return async function execute(name, args) {
    switch (name) {
      case "add_task": {
        const title = clip(args.title, 200);
        if (!title) return { ok: false, error: "missing_title" };
        const priority = ["normal", "important", "high"].includes(args.priority) ? args.priority : "normal";
        const due_date = /^\d{4}-\d{2}-\d{2}$/.test(args.due_date || "") ? args.due_date : null;
        const { error } = await supabase.from("tasks").insert({ user_id: userId, title, priority, due_date });
        return error ? { ok: false, error: error.message } : { ok: true, title, priority, due_date };
      }

      case "complete_task": {
        const { data: open } = await supabase
          .from("tasks").select("id, title").eq("user_id", userId).eq("is_done", false).limit(200);
        const { match, candidates } = matchByTitle(open || [], args.title);
        if (candidates.length > 0) return { ok: false, error: "ambiguous", candidates };
        if (!match) return { ok: false, error: "not_found" };
        await supabase.from("tasks").update({ is_done: true }).eq("id", match.id);
        return { ok: true, title: match.title };
      }

      case "add_to_today": {
        const title = clip(args.title, 200);
        if (!title) return { ok: false, error: "missing_title" };
        const { count } = await supabase
          .from("top3_tasks").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("for_date", today);
        if ((count || 0) >= 3) return { ok: false, error: "top3_full" };
        const { error } = await supabase.from("top3_tasks").insert({ user_id: userId, title, for_date: today });
        return error ? { ok: false, error: error.message } : { ok: true, title };
      }

      case "add_habit": {
        const habitName = clip(args.name, 100);
        if (!habitName) return { ok: false, error: "missing_name" };
        const emoji = /\p{Extended_Pictographic}/u.test(args.emoji || "") ? args.emoji.match(/\p{Extended_Pictographic}/u)[0] : "🔥";
        const { error } = await supabase.from("habits").insert({ user_id: userId, name: habitName, emoji });
        return error ? { ok: false, error: error.message } : { ok: true, name: habitName };
      }

      case "log_habit_done": {
        const { data: habits } = await supabase.from("habits").select("id, name").eq("user_id", userId).limit(200);
        const { match, candidates } = matchByTitle((habits || []).map((h) => ({ id: h.id, title: h.name })), args.name);
        if (candidates.length > 0) return { ok: false, error: "ambiguous", candidates };
        if (!match) return { ok: false, error: "not_found" };
        const { data: existing } = await supabase
          .from("habit_logs").select("id").eq("user_id", userId).eq("habit_id", match.id).eq("done_date", today).maybeSingle();
        if (existing) return { ok: true, name: match.title, already_done: true };
        await supabase.from("habit_logs").insert({ user_id: userId, habit_id: match.id, done_date: today });
        return { ok: true, name: match.title };
      }

      case "add_goal": {
        const title = clip(args.title, 200);
        if (!title) return { ok: false, error: "missing_title" };
        const period = args.period === "monthly" ? "monthly" : "weekly";
        const { error } = await supabase.from("goals").insert({ user_id: userId, title, period });
        return error ? { ok: false, error: error.message } : { ok: true, title, period };
      }

      case "log_trade": {
        const symbol = clip(args.symbol, 20).toUpperCase();
        if (!symbol) return { ok: false, error: "missing_symbol" };
        const result = ["win", "loss", "breakeven", "open"].includes(args.result) ? args.result : "open";
        const direction = ["long", "short"].includes(args.direction) ? args.direction : null;
        const pnl = Number.isFinite(args.pnl) ? args.pnl : null;
        const fees = Number.isFinite(args.fees) ? args.fees : 0;
        const { error } = await supabase.from("trading_journal").insert({
          user_id: userId, symbol, trade_date: today, direction, result, pnl, fees,
        });
        return error ? { ok: false, error: error.message } : { ok: true, symbol, result, pnl };
      }

      case "add_content_idea": {
        const title = clip(args.title, 200);
        if (!title) return { ok: false, error: "missing_title" };
        const platform = ["youtube", "podcast", "instagram", "tiktok", "linkedin", "other"].includes(args.platform) ? args.platform : "other";
        const hook = clip(args.hook, 300) || null;
        const { error } = await supabase.from("content_items").insert({ user_id: userId, title, hook, platform, status: "idea" });
        return error ? { ok: false, error: error.message } : { ok: true, title, platform };
      }

      case "add_world_item": {
        const kind = ["music", "movie", "show", "podcast", "book", "place", "hobby"].includes(args.kind) ? args.kind : null;
        const title = clip(args.title, 150);
        if (!kind || !title) return { ok: false, error: "missing_fields" };
        const subtitle = clip(args.subtitle, 150) || null;
        const status = WORLD_DEFAULT_STATUS[kind];
        const { error } = await supabase.from("world_items").insert({
          user_id: userId, kind, title, subtitle, status, is_public: false,
        });
        return error ? { ok: false, error: error.message } : { ok: true, kind, title };
      }

      case "add_business_idea": {
        const title = clip(args.title, 200);
        if (!title) return { ok: false, error: "missing_title" };
        const description = clip(args.description, 500) || null;
        const { error } = await supabase.from("business_ideas").insert({ user_id: userId, title, description, stage: "idea" });
        return error ? { ok: false, error: error.message } : { ok: true, title };
      }

      case "list_reminders": {
        const weekAhead = addDaysISO(7);
        const [{ data: tasks }, { data: assignments }, { data: orders }] = await Promise.all([
          supabase.from("tasks").select("title, priority, due_date").eq("user_id", userId).eq("is_done", false).order("due_date", { ascending: true }).limit(15),
          supabase.from("mba_assignments").select("title, due_date").eq("user_id", userId).neq("status", "completed").lte("due_date", weekAhead).order("due_date", { ascending: true }).limit(10),
          supabase.from("supply_chain_orders").select("items, customer, expected_delivery, status").eq("user_id", userId).not("status", "in", "(delivered,arrived,cancelled,draft)").limit(10),
        ]);
        const delayed = (orders || []).filter((o) => o.status === "delayed" || (o.expected_delivery && o.expected_delivery < today));
        return {
          ok: true,
          open_tasks: (tasks || []).map((t) => ({ title: t.title, priority: t.priority, due_date: t.due_date, overdue: !!(t.due_date && t.due_date < today) })),
          upcoming_assignments: (assignments || []).map((a) => ({ title: a.title, due_date: a.due_date })),
          delayed_orders: delayed.map((o) => ({ what: o.items || o.customer })),
        };
      }

      case "summarize_today": {
        const [{ data: doneTasks }, { data: top3 }, { data: habitLogs }, { data: trades }, { data: content }] = await Promise.all([
          supabase.from("tasks").select("title").eq("user_id", userId).eq("is_done", true).gte("created_at", `${today}T00:00:00.000Z`).limit(50),
          supabase.from("top3_tasks").select("title, is_done").eq("user_id", userId).eq("for_date", today),
          supabase.from("habit_logs").select("habit_id").eq("user_id", userId).eq("done_date", today),
          supabase.from("trading_journal").select("symbol, result, pnl, fees").eq("user_id", userId).eq("trade_date", today),
          supabase.from("content_items").select("title").eq("user_id", userId).gte("created_at", `${today}T00:00:00.000Z`).limit(20),
        ]);
        return {
          ok: true,
          note: "Journal entries are intentionally never included here.",
          tasks_completed: (doneTasks || []).map((t) => t.title),
          top3: (top3 || []).map((t) => ({ title: t.title, done: t.is_done })),
          habits_done_count: (habitLogs || []).length,
          trades: (trades || []).map((t) => ({ symbol: t.symbol, result: t.result, net: (Number(t.pnl) || 0) - (Number(t.fees) || 0) })),
          content_ideas_added: (content || []).map((c) => c.title),
        };
      }

      default:
        return { ok: false, error: "unknown_tool" };
    }
  };
}
