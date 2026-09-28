import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import Onboarding from "@/components/Onboarding";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

// Hamzawi's first conversation: five short questions, then a proposal Ahmed
// can edit before anything is saved. Always skippable.
export default async function OnboardingPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <Onboarding
      userId={user.id}
      name={profile?.display_name || ""}
      locale={locale}
      strings={strings.onboarding}
    />
  );
}
