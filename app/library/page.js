import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import LibraryManager from "@/components/LibraryManager";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function LibraryPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: books } = await supabase
    .from("library_books")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <Link href="/learning" className="text-xs text-ink-muted dark:text-moon-muted hover:text-lantern inline-flex items-center gap-1 mb-1">‹ {strings.nav.learning}</Link>
          <h1 className="font-display text-3xl">{strings.library.title}</h1>
          <p className="text-ink-muted dark:text-moon-muted mt-1">{strings.library.subtitle}</p>
        </div>
        <LibraryManager userId={user.id} initialBooks={books || []} strings={strings} />
      </main>
    </div>
  );
}
