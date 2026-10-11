import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import FadeIn from "@/components/FadeIn";

export default async function SearchPage({ searchParams }) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const q = (searchParams?.q || "").trim();
  const results = {
    tasks: [], events: [], interests: [], notes: [], world: [], goals: [], memories: [],
    mbaCourses: [], mbaAssignments: [], research: [], library: [],
    businessProjects: [], businessIdeas: [], businessContacts: [],
    supplyOrders: [], supplyIssues: [], supplySuppliers: [],
    content: [], trading: [], quran: [], tradingNotes: [],
    habits: [], english: [],
  };

  if (q) {
    const like = `%${q}%`;

    const [
      tasksRes, eventsRes, interestsRes, notesRes, worldRes, goalsRes, memoriesRes,
      mbaCoursesRes, mbaAssignmentsRes, researchRes, libraryRes,
      businessProjectsRes, businessIdeasRes, businessContactsRes,
      supplyOrdersRes, supplyIssuesRes, supplySuppliersRes,
      contentRes, tradingRes, quranRes, tradingNotesRes,
      habitsRes, englishRes,
    ] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", user.id).ilike("title", like),
      supabase.from("events").select("*").eq("user_id", user.id).ilike("title", like),
      supabase.from("interests").select("*").eq("user_id", user.id).ilike("value", like),
      supabase.from("notes").select("*").eq("user_id", user.id).ilike("content", like).neq("kind", "daily_brief"),
      supabase.from("world_items").select("*").eq("user_id", user.id).ilike("title", like),
      supabase.from("goals").select("*").eq("user_id", user.id).ilike("title", like),
      supabase.from("memories").select("*").eq("user_id", user.id).ilike("title", like),
      supabase.from("mba_courses").select("*").eq("user_id", user.id).ilike("name", like),
      supabase.from("mba_assignments").select("*").eq("user_id", user.id).ilike("title", like),
      supabase.from("research_projects").select("*").eq("user_id", user.id).ilike("title", like),
      supabase.from("library_books").select("*").eq("user_id", user.id).ilike("title", like),
      supabase.from("business_projects").select("*").eq("user_id", user.id).ilike("name", like),
      supabase.from("business_ideas").select("*").eq("user_id", user.id).ilike("title", like),
      supabase.from("business_contacts").select("*").eq("user_id", user.id).ilike("name", like),
      supabase.from("supply_chain_orders").select("*").eq("user_id", user.id).ilike("items", like),
      supabase.from("supply_chain_issues").select("*").eq("user_id", user.id).ilike("title", like),
      supabase.from("supply_chain_suppliers").select("*").eq("user_id", user.id).ilike("name", like),
      supabase.from("content_items").select("*").eq("user_id", user.id).ilike("title", like),
      supabase.from("trading_journal").select("*").eq("user_id", user.id).ilike("symbol", like),
      supabase.from("quran_portions").select("*").eq("user_id", user.id).ilike("surah", like),
      supabase.from("trading_day_notes").select("*").eq("user_id", user.id).ilike("lesson", like),
      supabase.from("habits").select("*").eq("user_id", user.id).ilike("name", like),
      supabase.from("english_sessions").select("*").eq("user_id", user.id).ilike("topic", like),
    ]);

    results.tasks = tasksRes.data || [];
    results.events = eventsRes.data || [];
    results.interests = interestsRes.data || [];
    results.notes = notesRes.data || [];
    results.world = worldRes.data || [];
    results.goals = goalsRes.data || [];
    results.memories = memoriesRes.data || [];
    results.mbaCourses = mbaCoursesRes.data || [];
    results.mbaAssignments = mbaAssignmentsRes.data || [];
    results.research = researchRes.data || [];
    results.library = libraryRes.data || [];
    results.businessProjects = businessProjectsRes.data || [];
    results.businessIdeas = businessIdeasRes.data || [];
    results.businessContacts = businessContactsRes.data || [];
    results.supplyOrders = supplyOrdersRes.data || [];
    results.supplyIssues = supplyIssuesRes.data || [];
    results.supplySuppliers = supplySuppliersRes.data || [];
    results.content = contentRes.data || [];
    results.trading = tradingRes.data || [];
    results.quran = quranRes.data || [];
    results.tradingNotes = tradingNotesRes.data || [];
    results.habits = habitsRes.data || [];
    results.english = englishRes.data || [];
  }

  const totalCount = Object.values(results).reduce((sum, list) => sum + list.length, 0);

  const SECTIONS = [
    { key: "tasks", emoji: "✅", label: "مهام", href: "/tasks", render: (t) => t.title },
    { key: "goals", emoji: "🏆", label: "أهداف", href: "/goals", render: (g) => `${g.title} — ${g.progress}%` },
    { key: "events", emoji: "📅", label: "مواعيد", href: "/calendar", render: (e) => `${e.title} — ${e.event_date}` },
    { key: "memories", emoji: "🗺️", label: "ذكريات", href: "/timeline", render: (m) => `${m.year} ${m.emoji} ${m.title}` },
    { key: "notes", emoji: "📝", label: "ملاحظات ويوميات", href: "/journal", render: (n) => n.content.slice(0, 100) },
    { key: "world", emoji: "🎧", label: "عالمي", href: "/world", render: (w) => w.title },
    { key: "interests", emoji: "❤️", label: "اهتمامات", href: "/interests", render: (i) => `${i.value} (${i.category})` },
    { key: "mbaCourses", emoji: "🎓", label: "مواد MBA", href: "/mba/courses", render: (c) => c.name },
    { key: "mbaAssignments", emoji: "🎓", label: "تسليمات MBA", href: "/mba/courses", render: (a) => `${a.title} — ${a.status}` },
    { key: "research", emoji: "🔬", label: "أبحاث", href: "/mba/research", render: (r) => `${r.title} (${r.status})` },
    { key: "library", emoji: "📚", label: "المكتبة", href: "/library", render: (b) => `${b.title}${b.author ? ` — ${b.author}` : ""}` },
    { key: "businessProjects", emoji: "🏗️", label: "مشاريع بيزنس", href: "/business/projects", render: (p) => `${p.name} (${p.status})` },
    { key: "businessIdeas", emoji: "💡", label: "أفكار بيزنس", href: "/business/ideas", render: (i) => `${i.title} (${i.stage})` },
    { key: "businessContacts", emoji: "👤", label: "جهات اتصال بيزنس", href: "/business/contacts", render: (c) => c.name },
    { key: "supplyOrders", emoji: "📦", label: "طلبات سلسلة التوريد", href: "/supply-chain/orders", render: (o) => `${o.items} (${o.status})` },
    { key: "supplyIssues", emoji: "⚠️", label: "مشاكل سلسلة التوريد", href: "/supply-chain/issues", render: (i) => `${i.title} (${i.status})` },
    { key: "supplySuppliers", emoji: "🚚", label: "موردين", href: "/supply-chain/suppliers", render: (s) => s.name },
    { key: "content", emoji: "🎙️", label: "أفكار محتوى", href: "/creator", render: (c) => `${c.title} (${c.status})` },
    { key: "trading", emoji: "📈", label: "دفتر الصفقات", href: "/trading/journal", render: (t) => `${t.symbol} (${t.result})` },
    { key: "quran", emoji: "📖", label: "القرآن", href: "/learning", render: (q) => `${q.surah} — ${q.status === "reviewing" ? "مراجعة" : "حفظ"}` },
    { key: "tradingNotes", emoji: "🪞", label: "انعكاسات التداول", href: "/trading/journal", render: (n) => `${n.note_date} — ${n.lesson}` },
    { key: "habits", emoji: "🔥", label: "عادات", href: "/growth", render: (h) => `${h.emoji} ${h.name}` },
    { key: "english", emoji: "🗣️", label: "جلسات إنجليزي", href: "/english", render: (s) => s.topic },
  ];

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 pb-16 space-y-6">
        <h1 className="font-display text-3xl">🔎 نتائج البحث عن «{q}»</h1>

        {totalCount === 0 && (
          <p className="text-ink-muted dark:text-moon-muted">مفيش نتائج.</p>
        )}

        {SECTIONS.map((section, idx) => {
          const items = results[section.key];
          if (!items || items.length === 0) return null;
          return (
            <FadeIn key={section.key} delay={idx * 0.04}>
              <Link href={section.href} className="block card p-4 hover:bg-black/5 dark:hover:bg-white/5 transition">
                <h2 className="text-sm text-ink-muted dark:text-moon-muted mb-2">
                  {section.emoji} {section.label}
                </h2>
                <ul className="space-y-1">
                  {items.map((item) => <li key={item.id}>{section.render(item)}</li>)}
                </ul>
              </Link>
            </FadeIn>
          );
        })}
      </main>
    </div>
  );
}
