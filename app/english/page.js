import { redirect } from "next/navigation";
import Link from "next/link";
import { Flame, GraduationCap } from "lucide-react";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

function calcStreak(dateStrings) {
  const set = new Set(dateStrings);
  let streak = 0;
  const cursor = new Date();
  if (!set.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default async function EnglishTrackerPage() {
  const locale = getLocale();
  const strings = t(locale);
  const en = strings.english;

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sessions } = await supabase
    .from("english_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = sessions || [];
  const dateStrings = [...new Set(list.map((s) => s.created_at.slice(0, 10)))];
  const streak = calcStreak(dateStrings);

  const vocabMap = new Map();
  list.forEach((s) => {
    (s.vocabulary || []).forEach((v) => {
      if (v.word && !vocabMap.has(v.word.toLowerCase())) vocabMap.set(v.word.toLowerCase(), v);
    });
  });
  const vocabulary = Array.from(vocabMap.values());

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-3xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <Link href="/learning" className="text-xs text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon inline-flex items-center gap-1 mb-1">‹ {strings.nav.learning}</Link>
          <h1 className="font-display text-3xl">{en.title}</h1>
          <p className="text-ink-muted dark:text-moon-muted mt-1">{en.subtitle}</p>
        </div>

        {list.length === 0 ? (
          <div className="card p-8 text-center space-y-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sage/15 text-sage dark:text-sage-soft">
              <GraduationCap size={20} strokeWidth={2} />
            </span>
            <p className="text-sm text-ink-muted dark:text-moon-muted">{en.noSessions}</p>
            <Link href="/ai" className="inline-block text-sm text-sage dark:text-sage-soft underline">{en.goToChat}</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="card p-4">
                <p className="text-xs text-ink-muted dark:text-moon-muted mb-1">{en.totalSessions}</p>
                <p className="text-2xl font-display">{list.length}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-ink-muted dark:text-moon-muted mb-1 flex items-center gap-1">
                  <Flame size={13} strokeWidth={2} className="text-sage dark:text-sage-soft" /> {en.currentStreak}
                </p>
                <p className="text-2xl font-display">{streak} <span className="text-sm text-ink-muted dark:text-moon-muted">{en.streakUnit}</span></p>
              </div>
            </div>

            {vocabulary.length > 0 && (
              <div className="card p-6">
                <h2 className="font-display text-xl mb-3">{en.vocabularyBank}</h2>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                  {vocabulary.map((v, i) => (
                    <p key={i}><strong>{v.word}</strong> — {v.meaning}</p>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="font-display text-xl mb-3">{en.recentSessions}</h2>
              <div className="space-y-2">
                {list.slice(0, 15).map((s) => (
                  <div key={s.id} className="card p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.topic || "—"}</p>
                      <p className="text-xs text-ink-muted dark:text-moon-muted">{s.created_at.slice(0, 10)}</p>
                    </div>
                    {s.self_rating && (
                      <span className="text-xs shrink-0 rounded-full bg-sage/15 text-sage dark:text-sage-soft px-2.5 py-1 font-medium">
                        {s.self_rating}/5
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
