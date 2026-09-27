"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import LanguageToggle from "./LanguageToggle";

export default function ForgotPasswordForm({ strings, locale }) {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const a = strings.auth;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    setLoading(false);
    if (error) {
      setStatus(a.forgotGenericError);
    } else {
      setStatus(a.forgotSuccess);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-paper dark:bg-night aurora-bg">
      <div className="fixed top-5 end-5 z-10">
        <LanguageToggle locale={locale} ariaLabel={strings.switchLanguageAria} variant="compact" />
      </div>
      <div className="w-full max-w-sm animate-fade-up">
        <h1 className="font-display text-3xl mb-1 text-center">{a.forgotTitle}</h1>
        <p className="text-ink-muted dark:text-moon-muted text-center mb-8">
          {a.forgotSubtitle}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="w-full rounded-soft border border-black/10 dark:border-white/10
                       bg-transparent px-4 py-3 outline-none focus:border-lantern"
          />

          {status && <p className="text-sm text-dusk">{status}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-soft bg-lantern text-night font-medium py-3
                       shadow-lantern hover:brightness-105 transition disabled:opacity-60"
          >
            {loading ? a.sending : a.sendLink}
          </button>
        </form>

        <p className="text-center text-sm text-ink-muted dark:text-moon-muted mt-6">
          <Link href="/login" className="text-lantern underline">{a.backToLogin}</Link>
        </p>
      </div>
    </main>
  );
}
