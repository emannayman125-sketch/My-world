import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import IssuesManager from "@/components/IssuesManager";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function IssuesPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: issues }, { data: orders }, { data: suppliers }] = await Promise.all([
    supabase.from("supply_chain_issues").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("supply_chain_orders").select("id, items").eq("user_id", user.id),
    supabase.from("supply_chain_suppliers").select("id, name").eq("user_id", user.id),
  ]);

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <p className="ops-label mb-1">SUPPLY CHAIN — OPS</p>
          <h1 className="font-display text-3xl">{strings.supplyChain.issues}</h1>
        </div>
        <IssuesManager userId={user.id} initialIssues={issues || []} orders={orders || []} suppliers={suppliers || []} strings={strings} />
      </main>
    </div>
  );
}
