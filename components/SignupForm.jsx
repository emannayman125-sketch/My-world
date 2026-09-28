"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import LanguageToggle from "./LanguageToggle";

export default function SignupForm({ strings, locale }) {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const a = strings.auth;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setError(a.signupError);
      return;
    }

    setMessage(a.signupSuccess);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-paper dark:bg-night aurora-bg">
      <div className="fixed top-5 end-5 z-10">
        <LanguageToggle locale={locale} ariaLabel={strings.switchLanguageAria} variant="compact" />
      </div>
      <div className="w-full max-w-sm animate-fade-up">
        <h1 className="font-display text-3xl mb-1 text-center">{a.signupTitle}</h1>
        <p className="text-ink-muted dark:text-moon-muted text-center mb-8">
          {a.signupSubtitle}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">{a.email}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-soft border border-black/10 dark:border-white/10
                         bg-transparent px-4 py-3 outline-none focus:border-sage"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">{a.password}</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-soft border border-black/10 dark:border-white/10
                         bg-transparent px-4 py-3 outline-none focus:border-sage"
              placeholder={a.passwordHint}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-dusk">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-soft bg-lantern text-night font-medium py-3
                       shadow-lantern hover:brightness-105 transition disabled:opacity-60"
          >
            {loading ? a.creating : a.createAccount}
          </button>
        </form>

        <p className="text-center text-sm text-ink-muted dark:text-moon-muted mt-6">
          {a.haveAccount}{" "}
          <Link href="/login" className="text-sage dark:text-sage-soft underline">
            {a.signIn}
          </Link>
        </p>
      </div>
    </main>
  );
}
