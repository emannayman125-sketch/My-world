import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import OrdersManager from "@/components/OrdersManager";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function OrdersPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: orders }, { data: suppliers }, { data: projects }] = await Promise.all([
    supabase.from("supply_chain_orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("supply_chain_suppliers").select("id, name").eq("user_id", user.id),
    supabase.from("business_projects").select("id, name").eq("user_id", user.id),
  ]);

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <p className="ops-label mb-1">SUPPLY CHAIN — OPS</p>
          <h1 className="font-display text-3xl">{strings.supplyChain.orders}</h1>
        </div>
        <OrdersManager userId={user.id} initialOrders={orders || []} suppliers={suppliers || []} projects={projects || []} strings={strings} />
      </main>
    </div>
  );
}
