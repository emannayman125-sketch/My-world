import { redirect } from "next/navigation";
import Link from "next/link";
import { Truck, Package, AlertTriangle, ArrowLeft, ArrowRight } from "lucide-react";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";
import { todayISO, addDaysISO } from "@/lib/time";

export default async function SupplyChainHubPage() {
  const locale = getLocale();
  const strings = t(locale);
  const s = strings.supplyChain;
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = todayISO();
  const in7Days = addDaysISO(7);

  const [{ data: suppliers }, { data: orders }, { data: issues }] = await Promise.all([
    supabase.from("supply_chain_suppliers").select("id, next_followup").eq("user_id", user.id),
    supabase.from("supply_chain_orders").select("id, status").eq("user_id", user.id),
    supabase.from("supply_chain_issues").select("id, status").eq("user_id", user.id),
  ]);

  const delayedOrders = (orders || []).filter((o) => o.status === "delayed").length;
  const openIssues = (issues || []).filter((i) => i.status !== "resolved").length;
  const upcomingFollowups = (suppliers || []).filter(
    (sp) => sp.next_followup && sp.next_followup >= today && sp.next_followup <= in7Days
  ).length;

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <p className="ops-label mb-1">SUPPLY CHAIN — OPS</p>
          <Link href="/business-operations" className="text-xs text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon inline-flex items-center gap-1 mb-1">‹ {strings.nav.businessOps}</Link>
          <h1 className="font-display text-3xl">{s.title}</h1>
          <p className="text-ink-muted dark:text-moon-muted mt-1">{s.subtitle}</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <IndicatorCard label={s.delayedOrders} value={delayedOrders} tone={delayedOrders > 0 ? "danger" : "ok"} />
          <IndicatorCard label={s.openIssues} value={openIssues} tone={openIssues > 0 ? "warn" : "ok"} />
          <IndicatorCard label={s.upcomingFollowups} value={upcomingFollowups} tone="info" />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Link href="/supply-chain/suppliers" className="ops-card ops-card-hover p-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 shrink-0">
              <Truck size={18} strokeWidth={2} />
            </span>
            <div className="flex-1">
              <p className="font-medium text-sm">{s.suppliers}</p>
              <p className="text-xs text-ink-muted dark:text-moon-muted">{(suppliers || []).length}</p>
            </div>
            <Arrow size={16} className="text-ink-muted/60" />
          </Link>

          <Link href="/supply-chain/orders" className="ops-card ops-card-hover p-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
              <Package size={18} strokeWidth={2} />
            </span>
            <div className="flex-1">
              <p className="font-medium text-sm">{s.orders}</p>
              <p className="text-xs text-ink-muted dark:text-moon-muted">{(orders || []).length}</p>
            </div>
            <Arrow size={16} className="text-ink-muted/60" />
          </Link>

          <Link href="/supply-chain/issues" className="ops-card ops-card-hover p-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15 text-red-500 shrink-0">
              <AlertTriangle size={18} strokeWidth={2} />
            </span>
            <div className="flex-1">
              <p className="font-medium text-sm">{s.issues}</p>
              <p className="text-xs text-ink-muted dark:text-moon-muted">{openIssues}</p>
            </div>
            <Arrow size={16} className="text-ink-muted/60" />
          </Link>
        </div>
      </main>
    </div>
  );
}

function IndicatorCard({ label, value, tone }) {
  const toneClass = {
    danger: "text-red-500",
    warn: "text-amber-600 dark:text-amber-400",
    ok: "text-emerald-600 dark:text-emerald-400",
    info: "text-sky-600 dark:text-sky-400",
  }[tone];

  return (
    <div className="ops-card p-4">
      <p className="ops-label mb-1.5">{label}</p>
      <p className={`text-2xl font-mono font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
