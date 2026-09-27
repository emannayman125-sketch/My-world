import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { createServerSupabase } from "@/lib/supabaseServer";
import { getDueHiddenMessage } from "@/lib/hiddenMessages";
import AppHeader from "@/components/AppHeader";
import TopThree from "@/components/TopThree";
import CurrentlySection from "@/components/CurrentlySection";
import SurpriseMessage from "@/components/SurpriseMessage";
import BirthdayCelebration from "@/components/BirthdayCelebration";
import ShareDayButton from "@/components/ShareDayButton";
import ReminderNotifier from "@/components/ReminderNotifier";
import ProgressRing from "@/components/ProgressRing";
import FadeIn from "@/components/FadeIn";
import MoodCheckin from "@/components/MoodCheckin";
import HabitsToday from "@/components/HabitsToday";
import QuoteOfTheDay from "@/components/QuoteOfTheDay";
import GettingStarted from "@/components/GettingStarted";
import { pickQuote } from "@/lib/quotes/pickQuote";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function DashboardPage() {
  const locale = getLocale();
  const strings = t(locale);
  const d = strings.dashboard;
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, has_seen_welcome, birthday_month, birthday_day, last_birthday_shown_year, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile?.has_seen_welcome) redirect("/welcome");

  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: top3 },
    { data: currentlyItems },
    { data: todayEvents },
    { data: customQuotes },
    { data: journalEntries },
    { data: todayMood },
    { data: habits },
    { data: habitLogsToday },
    { data: anyTask },
    { data: anyMemory },
    { data: anyWorldItem },
    dueMessage,
  ] = await Promise.all([
    supabase.from("top3_tasks").select("*").eq("user_id", user.id).eq("for_date", today).order("created_at", { ascending: true }),
    supabase.from("currently_items").select("*").eq("user_id", user.id),
    supabase.from("events").select("*").eq("user_id", user.id).eq("event_date", today).order("event_time", { ascending: true }),
    supabase.from("notes").select("content").eq("user_id", user.id).eq("kind", "quote"),
    supabase.from("notes").select("content, created_at, kind").eq("user_id", user.id).in("kind", ["journal", "treasure"]),
    supabase.from("daily_moods").select("mood").eq("user_id", user.id).eq("mood_date", today).maybeSingle(),
    supabase.from("habits").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
    supabase.from("habit_logs").select("habit_id").eq("user_id", user.id).eq("done_date", today),
    supabase.from("tasks").select("id").eq("user_id", user.id).limit(1),
    supabase.from("memories").select("id").eq("user_id", user.id).limit(1),
    supabase.from("world_items").select("id").eq("user_id", user.id).limit(1),
    getDueHiddenMessage(supabase, user),
  ]);

  const name = profile?.display_name || (locale === "ar" ? "صديقي" : "friend");

  const doneCount = (top3 || []).filter((t) => t.is_done).length;
  const progressPercent = top3 && top3.length > 0 ? Math.round((doneCount / top3.length) * 100) : 0;

  const now = new Date();
  const currentYear = now.getFullYear();
  const isBirthdayToday =
    profile?.birthday_month === now.getMonth() + 1 &&
    profile?.birthday_day === now.getDate() &&
    profile?.last_birthday_shown_year !== currentYear;

  const personalThoughts = (customQuotes || []).map((q) => q.content).filter(Boolean);
  const quote = pickQuote({
    personalQuotes: personalThoughts,
    mood: todayMood?.mood,
    isBirthday: isBirthdayToday,
  });

  const onThisDay = (journalEntries || [])
    .filter((n) => {
      const dt = new Date(n.created_at);
      return dt.getMonth() === now.getMonth() && dt.getDate() === now.getDate() && dt.getFullYear() !== currentYear;
    })
    .sort((a, b) => (a.kind === "treasure" ? -1 : 1) - (b.kind === "treasure" ? -1 : 1));

  const greeting = now.getHours() < 12 ? d.greetingMorning : d.greetingEvening;

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <div className="aurora-bg">
        <AppHeader />
        <ReminderNotifier todayEvents={todayEvents || []} strings={strings} />
        {isBirthdayToday && <BirthdayCelebration userId={user.id} name={name} year={currentYear} strings={strings} />}

        <main className="max-w-6xl mx-auto px-6 lg:px-10 pt-4 lg:pt-8 pb-16 space-y-6">
          {dueMessage && (
            <FadeIn>
              <SurpriseMessage message={dueMessage} strings={strings} />
            </FadeIn>
          )}

          <FadeIn>
            <div className="card card-hover p-6 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                {profile?.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt={name}
                    className="w-14 h-14 rounded-full object-cover shrink-0"
                  />
                )}
                <div>
                  <h1 className="font-display text-3xl">
                    {greeting}, {name} ☀️
                  </h1>
                  <p className="text-ink-muted dark:text-moon-muted mt-1">{d.subtitle}</p>
                  <div className="mt-3">
                    <ShareDayButton name={name} top3={top3 || []} events={todayEvents || []} strings={strings} />
                  </div>
                </div>
              </div>
              <ProgressRing percent={progressPercent} label={d.progressToday} />
            </div>
          </FadeIn>

          <FadeIn delay={0.01}>
            <GettingStarted
              hasTasks={(anyTask || []).length > 0}
              hasMemory={(anyMemory || []).length > 0}
              hasWorldItem={(anyWorldItem || []).length > 0}
              strings={strings}
            />
          </FadeIn>

          <div className="lg:grid lg:grid-cols-3 lg:gap-6 lg:items-start space-y-6 lg:space-y-0">
            {/* Primary column — today's focus */}
            <div className="lg:col-span-2 space-y-6">
              <FadeIn delay={0.1}>
                <TopThree userId={user.id} initialTasks={top3 || []} strings={strings} />
              </FadeIn>

              <FadeIn delay={0.08}>
                <Link
                  href="/ai"
                  className="card card-hover p-4 flex items-center gap-3 hover:border-dusk/40 transition"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-dusk/15 text-dusk shrink-0">
                    <Sparkles size={16} strokeWidth={2} />
                  </span>
                  <span className="text-sm">{d.askHamzawi}</span>
                </Link>
              </FadeIn>

              {todayEvents && todayEvents.length > 0 && (
                <FadeIn delay={0.05}>
                  <div className="card card-hover p-6">
                    <h2 className="font-display text-xl mb-3">{d.todayEvents}</h2>
                    <ul className="space-y-1 text-sm">
                      {todayEvents.map((ev) => (
                        <li key={ev.id}>
                          {ev.event_time && <span className="text-ink-muted dark:text-moon-muted">{ev.event_time} — </span>}
                          {ev.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeIn>
              )}

              {onThisDay.length > 0 && (
                <FadeIn delay={0.03}>
                  <div className="card card-hover p-6">
                    <h2 className="font-display text-xl mb-3">{d.onThisDay}</h2>
                    <div className="space-y-3">
                      {onThisDay.map((n, i) => (
                        <p key={i} className="text-sm leading-7">
                          <span className="text-ink-muted dark:text-moon-muted">
                            {n.kind === "treasure" && "⭐ "}{new Date(n.created_at).getFullYear()} —{" "}
                          </span>
                          {n.content}
                        </p>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              )}
            </div>

            {/* Secondary column — mood, habits, currently, quote */}
            <div className="space-y-6">
              <FadeIn delay={0.02}>
                <MoodCheckin userId={user.id} initialMood={todayMood?.mood} strings={strings} />
              </FadeIn>

              <FadeIn delay={0.12}>
                <HabitsToday userId={user.id} habits={habits || []} initialLogsToday={habitLogsToday || []} strings={strings} />
              </FadeIn>

              <FadeIn delay={0.15}>
                <CurrentlySection userId={user.id} initialItems={currentlyItems || []} strings={strings} />
              </FadeIn>

              <FadeIn delay={0.2}>
                <QuoteOfTheDay quote={quote} userId={user.id} strings={strings} />
              </FadeIn>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
