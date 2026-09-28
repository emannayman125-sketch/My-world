import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import ProfileSettings from "@/components/ProfileSettings";
import BackupManager from "@/components/BackupManager";
import FontSizeControl from "@/components/FontSizeControl";

export default async function SettingsPage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username, is_bio_public, bio, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 pb-16 space-y-6">
        <h1 className="font-display text-3xl">⚙️ الإعدادات</h1>

        <ProfileSettings userId={user.id} initialProfile={profile} />

        <FontSizeControl />

        <div className="card p-6 space-y-2">
          <h2 className="font-display text-xl">🔐 مركز الخصوصية</h2>
          <p className="text-sm text-ink-muted dark:text-moon-muted">
            كل حاجة في الموقع خاصة افتراضيًا، ما عدا اللي تحددها بنفسك كـ 🌐 عام.
          </p>
          <a href="/privacy" className="text-sm text-sage dark:text-sage-soft underline">شوف التفاصيل كاملة</a>
        </div>

        <BackupManager userId={user.id} />
      </main>
    </div>
  );
}
