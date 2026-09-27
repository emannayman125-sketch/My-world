import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2, Truck, ArrowLeft, ArrowRight } from "lucide-react";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function BusinessOpsHubPage() {
  const locale = getLocale();
  const strings = t(locale);
  const b = strings.businessOpsHub;
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: projects }, { data: orders }] = await Promise.all([
    supabase.from("business_projects").select("id").eq("user_id", user.id),
    supabase.from("supply_chain_orders").select("id").eq("user_id", user.id),
  ]);

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <h1 className="font-display text-3xl">{b.title}</h1>
          <p className="text-ink-muted dark:text-moon-muted mt-1">{b.subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/business" className="exec-card exec-card-hover p-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B46F4D]/25 text-[#8a5339] dark:text-[#D8C6AF] shrink-0">
              <Building2 size={18} strokeWidth={2} />
            </span>
            <div className="flex-1">
              <p className="font-medium text-sm">{b.business}</p>
              <p className="text-xs text-ink-muted dark:text-moon-muted">{b.businessDesc}</p>
            </div>
            <span className="text-xs text-ink-muted dark:text-moon-muted shrink-0">{(projects || []).length}</span>
            <Arrow size={16} className="text-ink-muted/60 shrink-0" />
          </Link>

          <Link href="/supply-chain" className="ops-card ops-card-hover p-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/25 text-sky-700 dark:text-sky-400 shrink-0">
              <Truck size={18} strokeWidth={2} />
            </span>
            <div className="flex-1">
              <p className="font-medium text-sm">{b.supplyChain}</p>
              <p className="text-xs text-ink-muted dark:text-moon-muted">{b.supplyChainDesc}</p>
            </div>
            <span className="text-xs text-ink-muted dark:text-moon-muted shrink-0">{(orders || []).length}</span>
            <Arrow size={16} className="text-ink-muted/60 shrink-0" />
          </Link>
        </div>
      </main>
    </div>
  );
}
