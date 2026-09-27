import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import SuppliersManager from "@/components/SuppliersManager";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function SuppliersPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: suppliers } = await supabase
    .from("supply_chain_suppliers").select("*").eq("user_id", user.id).order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <p className="ops-label mb-1">SUPPLY CHAIN — OPS</p>
          <h1 className="font-display text-3xl">{strings.supplyChain.suppliers}</h1>
        </div>
        <SuppliersManager userId={user.id} initialSuppliers={suppliers || []} strings={strings} />
      </main>
    </div>
  );
}
