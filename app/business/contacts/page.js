import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import ContactsManager from "@/components/ContactsManager";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function BusinessContactsPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: contacts }, { data: projects }] = await Promise.all([
    supabase.from("business_contacts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("business_projects").select("id, name").eq("user_id", user.id),
  ]);

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <p className="exec-label mb-1">BUSINESS HUB</p>
          <h1 className="font-display text-3xl">{strings.business.contacts}</h1>
        </div>
        <ContactsManager userId={user.id} initialContacts={contacts || []} projects={projects || []} strings={strings} />
      </main>
    </div>
  );
}
