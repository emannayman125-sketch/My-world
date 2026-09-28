"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import LanguageToggle from "./LanguageToggle";

export default function ResetPasswordForm({ strings, locale }) {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const a = strings.auth;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) {
      setStatus(a.resetError);
    } else {
      setDone(true);
      setStatus(a.resetSuccess);
      setTimeout(() => router.push("/dashboard"), 1500);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-paper dark:bg-night aurora-bg">
      <div className="fixed top-5 end-5 z-10">
        <LanguageToggle locale={locale} ariaLabel={strings.switchLanguageAria} variant="compact" />
      </div>
      <div className="w-full max-w-sm animate-fade-up">
        <h1 className="font-display text-3xl mb-1 text-center">{a.resetTitle}</h1>
        <p className="text-ink-muted dark:text-moon-muted text-center mb-8">
          {a.resetSubtitle}
        </p>

        {!done && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={a.newPasswordPlaceholder}
              className="w-full rounded-soft border border-black/10 dark:border-white/10
                         bg-transparent px-4 py-3 outline-none focus:border-sage"
            />

            {status && <p className="text-sm text-red-500">{status}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-soft bg-lantern text-night font-medium py-3
                         shadow-lantern hover:brightness-105 transition disabled:opacity-60"
            >
              {loading ? a.saving : a.savePassword}
            </button>
          </form>
        )}

        {done && <p className="text-center text-sm text-dusk">{status}</p>}
      </div>
    </main>
  );
}
