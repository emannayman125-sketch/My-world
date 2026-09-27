"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { getClientLocale } from "@/lib/i18n/getClientLocale";

export default function SignOutButton({ label }) {
  const router = useRouter();
  const supabase = createClient();
  const fallback = getClientLocale() === "ar" ? "خروج" : "Sign out";

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon"
    >
      {label || fallback}
    </button>
  );
}
