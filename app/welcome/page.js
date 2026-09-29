import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import WelcomeLetter from "@/components/WelcomeLetter";

// This screen is always English, left-to-right, regardless of the
// site's language setting: it's a fixed personal letter, shown once.
//
// Preview: open /welcome?preview=1 to see the whole first-open experience
// (letter, then the birthday celebration) without using up the real one.
export default async function WelcomePage({ searchParams }) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const preview = searchParams?.preview === "1";

  const { data: profile } = await supabase
    .from("profiles")
    .select("has_seen_welcome")
    .eq("id", user.id)
    .single();

  if (profile?.has_seen_welcome && !preview) redirect("/dashboard");

  return (
    <main
      dir="ltr"
      lang="en"
      className="min-h-screen flex items-start justify-center px-6 py-12 sm:py-16 bg-paper dark:bg-night aurora-bg"
    >
      <div className="relative w-full max-w-xl">
        <WelcomeLetter userId={user.id} preview={preview} />
      </div>
    </main>
  );
}
