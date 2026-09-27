// Server-only. Builds a short, non-sensitive summary of the user's own
// data for a given context, to optionally include in the AI's system
// prompt. Journal entries are intentionally never included here, no
// matter the context or toggle -- that data stays out of any AI call.

export async function getContextKnowledge(supabase, userId, context) {
  const cap = (s, n) => (s && s.length > n ? s.slice(0, n) + "…" : s);

  try {
    if (context === "mba") {
      const [{ data: courses }, { data: assignments }] = await Promise.all([
        supabase.from("mba_courses").select("name").eq("user_id", userId).limit(10),
        supabase
          .from("mba_assignments")
          .select("title, due_date, status")
          .eq("user_id", userId)
          .neq("status", "completed")
          .order("due_date", { ascending: true })
          .limit(10),
      ]);
      if (!courses?.length && !assignments?.length) return null;
      return [
        courses?.length ? `Courses: ${courses.map((c) => c.name).join(", ")}` : "",
        assignments?.length
          ? `Upcoming assignments: ${assignments.map((a) => `${a.title} (due ${a.due_date || "no date"}, ${a.status})`).join("; ")}`
          : "",
      ].filter(Boolean).join("\n");
    }

    if (context === "research") {
      const { data } = await supabase
        .from("research_projects")
        .select("title, status")
        .eq("user_id", userId)
        .limit(10);
      if (!data?.length) return null;
      return `Research projects: ${data.map((r) => `${r.title} (${r.status})`).join("; ")}`;
    }

    if (context === "library") {
      const { data } = await supabase
        .from("library_books")
        .select("title, author, category")
        .eq("user_id", userId)
        .limit(10);
      if (!data?.length) return null;
      return `Library: ${data.map((b) => `${b.title}${b.author ? ` by ${b.author}` : ""} (${b.category})`).join("; ")}`;
    }

    if (context === "business") {
      const [{ data: projects }, { data: ideas }] = await Promise.all([
        supabase.from("business_projects").select("name, status").eq("user_id", userId).limit(10),
        supabase.from("business_ideas").select("title, stage").eq("user_id", userId).limit(10),
      ]);
      if (!projects?.length && !ideas?.length) return null;
      return [
        projects?.length ? `Business projects: ${projects.map((p) => `${p.name} (${p.status})`).join("; ")}` : "",
        ideas?.length ? `Business ideas: ${ideas.map((i) => `${i.title} (${i.stage})`).join("; ")}` : "",
      ].filter(Boolean).join("\n");
    }

    if (context === "supplyChain") {
      const [{ data: orders }, { data: issues }] = await Promise.all([
        supabase.from("supply_chain_orders").select("items, status").eq("user_id", userId).neq("status", "delivered").limit(10),
        supabase.from("supply_chain_issues").select("title, status, priority").eq("user_id", userId).neq("status", "resolved").limit(10),
      ]);
      if (!orders?.length && !issues?.length) return null;
      return [
        orders?.length ? `Open orders: ${orders.map((o) => `${o.items} (${o.status})`).join("; ")}` : "",
        issues?.length ? `Open issues: ${issues.map((i) => `${i.title} (${i.priority} priority, ${i.status})`).join("; ")}` : "",
      ].filter(Boolean).join("\n");
    }

    if (context === "creator") {
      const { data } = await supabase
        .from("content_items")
        .select("title, status, platform")
        .eq("user_id", userId)
        .limit(10);
      if (!data?.length) return null;
      return `Content pipeline: ${data.map((c) => `${c.title} (${c.status}, ${c.platform})`).join("; ")}`;
    }

    // Trading is the most sensitive financial data -- only summarized,
    // never raw entries, and only when explicitly requested via this context.
    if (context === "trading") {
      const { data } = await supabase
        .from("trading_journal")
        .select("symbol, result, pnl, lessons_learned")
        .eq("user_id", userId)
        .order("trade_date", { ascending: false })
        .limit(10);
      if (!data?.length) return null;
      return `Recent trades: ${data
        .map((t) => `${t.symbol} (${t.result}${t.pnl != null ? `, $${t.pnl}` : ""}${t.lessons_learned ? `, lesson: ${cap(t.lessons_learned, 80)}` : ""})`)
        .join("; ")}`;
    }

    if (context === "all") {
      const [{ data: tasks }, { data: assignments }] = await Promise.all([
        supabase.from("tasks").select("title").eq("user_id", userId).eq("is_done", false).limit(5),
        supabase.from("mba_assignments").select("title, due_date").eq("user_id", userId).neq("status", "completed").order("due_date").limit(3),
      ]);
      if (!tasks?.length && !assignments?.length) return null;
      return [
        tasks?.length ? `Open tasks: ${tasks.map((t) => t.title).join(", ")}` : "",
        assignments?.length ? `Upcoming MBA deadlines: ${assignments.map((a) => `${a.title} (${a.due_date})`).join(", ")}` : "",
      ].filter(Boolean).join("\n");
    }

    return null;
  } catch {
    return null;
  }
}
