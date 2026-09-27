"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import LanguageToggle from "./LanguageToggle";

export default function LoginForm({ strings, locale }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const a = strings.auth;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(a.loginError);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-paper dark:bg-night aurora-bg">
      <div className="fixed top-5 end-5 z-10">
        <LanguageToggle locale={locale} ariaLabel={strings.switchLanguageAria} variant="compact" />
      </div>
      <div className="w-full max-w-sm animate-fade-up">
        <h1 className="font-display text-3xl mb-1 text-center">{a.loginTitle}</h1>
        <p className="text-ink-muted dark:text-moon-muted text-center mb-8">
          {a.loginSubtitle}
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
                         bg-transparent px-4 py-3 outline-none focus:border-lantern"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">{a.password}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-soft border border-black/10 dark:border-white/10
                         bg-transparent px-4 py-3 outline-none focus:border-lantern"
              placeholder="••••••••"
            />
            <div className="text-end mt-1">
              <Link href="/forgot-password" className="text-xs text-ink-muted dark:text-moon-muted hover:text-lantern underline">
                {a.forgotPassword}
              </Link>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-soft bg-lantern text-night font-medium py-3
                       shadow-lantern hover:brightness-105 transition disabled:opacity-60"
          >
            {loading ? a.loggingIn : a.loginButton}
          </button>
        </form>

        <p className="text-center text-sm text-ink-muted dark:text-moon-muted mt-6">
          {a.needAccount}{" "}
          <Link href="/signup" className="text-lantern underline">
            {a.createNew}
          </Link>
        </p>
      </div>
    </main>
  );
}
