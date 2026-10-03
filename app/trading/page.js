import { redirect } from "next/navigation";
import Link from "next/link";
import { NotebookPen, BarChart3, ArrowLeft, ArrowRight } from "lucide-react";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";
import { todayISO } from "@/lib/time";

export default async function TradingHubPage() {
  const locale = getLocale();
  const strings = t(locale);
  const tr = strings.trading;
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: todayNote } = await supabase
    .from("trading_day_notes")
    .select("id")
    .eq("user_id", user.id)
    .eq("note_date", todayISO())
    .maybeSingle();

  return (
    <div className="desk-shell lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <h1 className="font-display text-3xl">{tr.title}</h1>
          <p className="desk-muted mt-1">{tr.subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/trading/journal" className="desk-card desk-card-hover p-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-dusk/15 text-dusk shrink-0">
              <NotebookPen size={18} strokeWidth={2} />
            </span>
            <div className="flex-1">
              <p className="font-medium text-sm">{tr.journal}</p>
              <p className="text-xs desk-muted">{todayNote ? tr.todayLogged : tr.todayNotLogged}</p>
            </div>
            <Arrow size={16} className="text-white/30" />
          </Link>

          <Link href="/trading/review" className="desk-card desk-card-hover p-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/15 text-violet-500 shrink-0">
              <BarChart3 size={18} strokeWidth={2} />
            </span>
            <div className="flex-1">
              <p className="font-medium text-sm">{tr.review}</p>
            </div>
            <Arrow size={16} className="text-white/30" />
          </Link>
        </div>

        <p className="text-xs desk-muted">{tr.disclaimer}</p>
      </main>
    </div>
  );
}
