import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import HandoverChecklist from "@/components/HandoverChecklist";

export default async function HandoverPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <h1 className="font-display text-3xl">🎁 عالم أحمد جاهز</h1>
          <p className="text-ink-muted dark:text-moon-muted mt-1">كل حاجة اتظبطت. الصفحة دي بس ليكِ.</p>
        </div>
        <HandoverChecklist />
      </main>
    </div>
  );
}
