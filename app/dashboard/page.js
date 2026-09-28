import { redirect } from "next/navigation";
import Link from "next/link";
import { Sparkles, Flame, CalendarDays, Headphones } from "lucide-react";
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
import { todayISO, cairoNow } from "@/lib/time";

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

  const today = todayISO();

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

  const cairo = cairoNow();
  const currentYear = cairo.year;
  const isBirthdayToday =
    profile?.birthday_month === cairo.month &&
    profile?.birthday_day === cairo.day &&
    profile?.last_birthday_shown_year !== currentYear;

  const personalThoughts = (customQuotes || []).map((q) => q.content).filter(Boolean);
  const quote = pickQuote({
    personalQuotes: personalThoughts,
    mood: todayMood?.mood,
    isBirthday: isBirthdayToday,
  });

  const onThisDay = (journalEntries || [])
    .filter((n) => {
      const c = cairoNow(new Date(n.created_at));
      return c.month === cairo.month && c.day === cairo.day && c.year !== currentYear;
    })
    .sort((a, b) => (a.kind === "treasure" ? -1 : 1) - (b.kind === "treasure" ? -1 : 1));

  const greeting = cairo.hour < 12 ? d.greetingMorning : d.greetingEvening;

  // ---- derived values for the Lantern Night layout ------------------------
  const top3List = top3 || [];
  const nextPriority = top3List.find((t) => !t.is_done);
  const habitsTotal = (habits || []).length;
  const habitsDone = (habitLogsToday || []).length;
  const eventsCount = (todayEvents || []).length;
  const firstCurrently = (currentlyItems || []).find((c) => c.title);

  const cardBase =
    "bg-paper-card dark:bg-night-card rounded-card border border-hairline dark:border-hairline-dark";

  // Only chips that actually have something to say -- never an empty tile.
  const chips = [];
  if (habitsTotal > 0) {
    chips.push({ key: "habits", icon: Flame, value: `${habitsDone}/${habitsTotal}`, label: d.chipHabits });
  }
  if (eventsCount > 0) {
    chips.push({ key: "events", icon: CalendarDays, value: String(eventsCount), label: d.chipEvents });
  }
  if (firstCurrently) {
    chips.push({ key: "currently", icon: Headphones, value: firstCurrently.title, label: null });
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <ReminderNotifier todayEvents={todayEvents || []} strings={strings} />
      {isBirthdayToday && <BirthdayCelebration userId={user.id} name={name} year={currentYear} strings={strings} />}

      <main className="max-w-2xl mx-auto px-6 pt-4 lg:pt-10 pb-20 space-y-8">
        {dueMessage && (
          <FadeIn>
            <SurpriseMessage message={dueMessage} strings={strings} />
          </FadeIn>
        )}

        {/* 1 — greeting: calm, personal, first thing on screen */}
        <FadeIn>
          <header className="flex items-center gap-4">
            {profile?.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={name}
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
            )}
            <div>
              <p className="text-sm text-ink-muted dark:text-moon-muted">
                {new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                  timeZone: "Africa/Cairo",
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <h1 className="font-display text-4xl leading-tight">
                {greeting}{locale === "ar" ? "،" : ","} {name}
              </h1>
            </div>
          </header>
        </FadeIn>

        <FadeIn delay={0.01}>
          <GettingStarted
            hasTasks={(anyTask || []).length > 0}
            hasMemory={(anyMemory || []).length > 0}
            hasWorldItem={(anyWorldItem || []).length > 0}
            strings={strings}
          />
        </FadeIn>

        {/* 2 — how the day is going (supporting info, not the star) */}
        <FadeIn delay={0.03}>
          <section className={`${cardBase} p-5 flex flex-wrap items-center gap-5`}>
            <ProgressRing percent={progressPercent} size={76} stroke={6} />
            <div className="min-w-0">
              <p className="text-sm">
                {d.doneOfTotal
                  .replace("{done}", String(doneCount))
                  .replace("{total}", String(top3List.length))}
              </p>
              <p className="mt-1 text-xs text-ink-muted dark:text-moon-muted">{d.keepGoing}</p>
            </div>
            <div className="ms-auto shrink-0">
              <ShareDayButton name={name} top3={top3List} events={todayEvents || []} strings={strings} />
            </div>
          </section>
        </FadeIn>

        {/* 3 — the ONE thing that gets the full lantern fill */}
        <FadeIn delay={0.05}>
          <section>
            <p className="mb-2 text-xs text-ink-muted dark:text-moon-muted">{d.mattersNow}</p>
            {nextPriority ? (
              <div className="rounded-card bg-lantern p-6 shadow-lantern">
                <p className="font-display text-2xl leading-snug text-lantern-ink">{nextPriority.title}</p>
              </div>
            ) : top3List.length > 0 ? (
              <div className={`${cardBase} p-5 text-sm text-ink-muted dark:text-moon-muted`}>
                {d.allDoneToday}
              </div>
            ) : (
              <div className="rounded-card border border-dashed border-hairline dark:border-hairline-dark p-5 text-sm text-ink-muted dark:text-moon-muted">
                {d.noPriorityYet}
              </div>
            )}
          </section>
        </FadeIn>

        {/* 4 — glanceable row, max 3, only what exists, all calm */}
        {chips.length > 0 && (
          <FadeIn delay={0.07}>
            <section className="grid grid-cols-3 gap-3">
              {chips.slice(0, 3).map((chip) => (
                <div
                  key={chip.key}
                  className={`${cardBase} !rounded-chip p-4 flex flex-col items-center gap-1.5 text-center min-w-0`}
                >
                  <chip.icon size={18} strokeWidth={2} className="text-ink-muted dark:text-moon-muted" />
                  <span className="text-sm font-medium truncate max-w-full">{chip.value}</span>
                  {chip.label && (
                    <span className="text-[11px] text-ink-muted dark:text-moon-muted">{chip.label}</span>
                  )}
                </div>
              ))}
            </section>
          </FadeIn>
        )}

        {/* 5 — the working list: add / check off today's important things */}
        <FadeIn delay={0.09}>
          <TopThree userId={user.id} initialTasks={top3List} strings={strings} />
        </FadeIn>

        {/* 6 — everything else, quieter, in one calm stack */}
        <div className="space-y-4">
          <p className="text-xs text-ink-muted dark:text-moon-muted">{d.moreForToday}</p>

          {eventsCount > 0 && (
            <FadeIn delay={0.05}>
              <div className={`${cardBase} p-6`}>
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

          <FadeIn delay={0.06}>
            <HabitsToday userId={user.id} habits={habits || []} initialLogsToday={habitLogsToday || []} strings={strings} />
          </FadeIn>

          <FadeIn delay={0.07}>
            <MoodCheckin userId={user.id} initialMood={todayMood?.mood} strings={strings} />
          </FadeIn>

          <FadeIn delay={0.08}>
            <CurrentlySection userId={user.id} initialItems={currentlyItems || []} strings={strings} />
          </FadeIn>

          {onThisDay.length > 0 && (
            <FadeIn delay={0.09}>
              <div className={`${cardBase} p-6`}>
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

          <FadeIn delay={0.1}>
            <Link
              href="/ai"
              className={`${cardBase} p-4 flex items-center gap-3 hover:border-sage/40 transition`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-dusk/15 text-dusk dark:text-dusk-soft shrink-0">
                <Sparkles size={16} strokeWidth={2} />
              </span>
              <span className="text-sm">{d.askHamzawi}</span>
            </Link>
          </FadeIn>

          <FadeIn delay={0.11}>
            <QuoteOfTheDay quote={quote} userId={user.id} strings={strings} />
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
