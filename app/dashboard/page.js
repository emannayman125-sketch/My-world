import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Sparkles, Flame, CalendarDays, Headphones, MoreHorizontal, Globe, GraduationCap, Building2, LineChart, ArrowLeft, ArrowRight } from "lucide-react";
import { createServerSupabase } from "@/lib/supabaseServer";
import { getDueHiddenMessage } from "@/lib/hiddenMessages";
import AppHeader from "@/components/AppHeader";
import CurrentlySection from "@/components/CurrentlySection";
import SurpriseMessage from "@/components/SurpriseMessage";
import BirthdayCelebration from "@/components/BirthdayCelebration";
import ShareDayButton from "@/components/ShareDayButton";
import ReminderNotifier from "@/components/ReminderNotifier";
import ProgressRing from "@/components/ProgressRing";
import FadeIn from "@/components/FadeIn";
import MoodCheckin from "@/components/MoodCheckin";
import HabitsToday from "@/components/HabitsToday";
import HeroPhoto from "@/components/HeroPhoto";
import GettingStarted from "@/components/GettingStarted";
import TodayPanel from "@/components/TodayPanel";
import Collapsible from "@/components/Collapsible";
import StreakCard from "@/components/StreakCard";
import ContentDueToday from "@/components/ContentDueToday";
import { getActivityDates } from "@/lib/activityDates";
import { computeActivityStreak } from "@/lib/streaks";
import OnboardingPrompt from "@/components/OnboardingPrompt";
import { pickQuote } from "@/lib/quotes/pickQuote";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";
import { todayISO, cairoNow } from "@/lib/time";

export default async function DashboardPage({ searchParams }) {
  const locale = getLocale();
  const strings = t(locale);
  const d = strings.dashboard;
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, display_name_en, has_seen_welcome, birthday_month, birthday_day, last_birthday_shown_year, avatar_url")
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
    { data: anyGoal },
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
    supabase.from("goals").select("id").eq("user_id", user.id).limit(1),
    getDueHiddenMessage(supabase, user, { shownToday: cookies().get("surprise_day")?.value === today }),
  ]);

  // Content scheduled to publish today with "remind me" on (Creator Studio) —
  // a small heads-up card, not a push notification: reliable regardless of
  // browser notification permissions, same spirit as ReminderNotifier below.
  const { data: contentDueToday } = await supabase
    .from("content_items")
    .select("id, title, platform, publish_time")
    .eq("user_id", user.id)
    .eq("publish_date", today)
    .eq("auto_publish", true)
    .neq("status", "published")
    .order("publish_time", { ascending: true, nullsFirst: false });

  const name =
    (locale === "en" && profile?.display_name_en) ||
    profile?.display_name ||
    (locale === "ar" ? "صديقي" : "friend");

  const doneCount = (top3 || []).filter((t) => t.is_done).length;
  const progressPercent = top3 && top3.length > 0 ? Math.round((doneCount / top3.length) * 100) : 0;

  const activityDates = await getActivityDates(supabase, user.id);
  const activityStreak = computeActivityStreak(new Set(activityDates), todayISO());

  const cairo = cairoNow();
  const currentYear = cairo.year;
  const previewBirthday = searchParams?.previewBirthday === "1";
  const isBirthdayToday =
    previewBirthday ||
    (profile?.birthday_month === cairo.month &&
      profile?.birthday_day === cairo.day &&
      profile?.last_birthday_shown_year !== currentYear);

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

  // Offer Hamzawi's setup while the world is still empty (never forced: "Not now" sets a cookie).
  const setupDone = cookies().get("onboarding_done")?.value === "1";
  const worldIsEmpty =
    (anyTask || []).length === 0 &&
    (habits || []).length === 0 &&
    (anyGoal || []).length === 0;
  const needsSetup = !setupDone && worldIsEmpty;

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

  // One-line preview for the collapsed "rest of your day" section, so
  // nothing important is invisible just because it's folded away.
  const MOOD_EMOJI = { good: "🙂", okay: "😐", tired: "😴", energized: "🔥", rough: "😔" };
  const restSummaryParts = [];
  if (todayMood?.mood) restSummaryParts.push(MOOD_EMOJI[todayMood.mood] || "");
  if (habitsTotal > 0) restSummaryParts.push(`${habitsDone}/${habitsTotal} ${d.chipHabits}`);
  if (eventsCount > 0) restSummaryParts.push(`${eventsCount} ${d.chipEvents}`);
  if (firstCurrently) restSummaryParts.push(firstCurrently.title);
  const restSummary = restSummaryParts.filter(Boolean).join(" · ");

  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const dateLabel = new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    timeZone: "Africa/Cairo",
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // The four doors into the rest of the app, as cards with a colored
  // header (original gradients -- no stock photos).
  const n = strings.nav;
  const quickCards = [
    { href: "/world", icon: Globe, label: n.world, bg: "linear-gradient(135deg,#AE4F2E 0%,#C2922F 100%)" },
    { href: "/learning", icon: GraduationCap, label: n.learning, bg: "linear-gradient(135deg,#1F7A5C 0%,#0F2B26 100%)" },
    { href: "/business-operations", icon: Building2, label: n.businessOps, bg: "linear-gradient(135deg,#5B3FA0 0%,#2B1F5C 100%)" },
    { href: "/trading", icon: LineChart, label: n.trading, bg: "linear-gradient(135deg,#C2922F 0%,#6B4A12 100%)" },
  ];

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <ReminderNotifier todayEvents={todayEvents || []} contentDueToday={contentDueToday || []} strings={strings} />
      {isBirthdayToday && <BirthdayCelebration userId={user.id} name={name} year={currentYear} strings={strings} preview={previewBirthday} nextHref={needsSetup || previewBirthday ? "/onboarding" : undefined} />}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 lg:pt-8 pb-20 space-y-6">
        {dueMessage && (
          <FadeIn>
            <SurpriseMessage message={dueMessage} strings={strings} />
          </FadeIn>
        )}

        {/* 1 — the banner: the photo, greeting and the day's quote on top */}
        <FadeIn>
          <HeroPhoto
            greeting={`${greeting}${locale === "ar" ? "،" : ","}`}
            name={name}
            dateLabel={dateLabel}
            avatarUrl={profile?.avatar_url}
            quote={quote}
            userId={user.id}
            strings={strings}
          />
        </FadeIn>

        {/* Only one "let's get started" nudge at a time, never both stacked */}
        {needsSetup ? (
          <FadeIn delay={0.015}>
            <OnboardingPrompt strings={d.onboardingPrompt} />
          </FadeIn>
        ) : (
          <FadeIn delay={0.01}>
            <GettingStarted
              hasTasks={(anyTask || []).length > 0}
              hasMemory={(anyMemory || []).length > 0}
              hasWorldItem={(anyWorldItem || []).length > 0}
              strings={strings}
            />
          </FadeIn>
        )}

        {/* 2 — four doors into the app */}
        <FadeIn delay={0.03}>
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {quickCards.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className={`${cardBase} group overflow-hidden shadow-card dark:shadow-cardDark hover:-translate-y-0.5 hover:shadow-glow transition`}
              >
                <div
                  className="h-20 flex items-center justify-center text-white/90"
                  style={{ backgroundImage: c.bg }}
                >
                  <c.icon size={30} strokeWidth={1.6} />
                </div>
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <span className="text-sm font-medium truncate">{c.label}</span>
                  <Arrow size={15} className="shrink-0 text-ink-muted dark:text-moon-muted group-hover:text-lantern transition" />
                </div>
              </Link>
            ))}
          </section>
        </FadeIn>

        {/* 3 — the working area. Mobile reads top to bottom in DOM order
            (quote, today, the rest); on large screens it becomes a main
            column plus a side column. */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* main column: what matters today */}
          <div className="lg:col-span-8 lg:col-start-1 lg:row-start-1 space-y-6 min-w-0">
            <FadeIn delay={0.05}>
              <section>
                <p className="mb-2 text-xs text-ink-muted dark:text-moon-muted">{d.mattersNow}</p>
                {nextPriority ? (
                  <div className="rounded-card bg-gilded p-6 shadow-lantern">
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

            {chips.length > 0 && (
              <FadeIn delay={0.06}>
                <section className={`${cardBase} grid grid-cols-3 divide-x divide-hairline dark:divide-hairline-dark rtl:divide-x-reverse`}>
                  {chips.slice(0, 3).map((chip) => (
                    <div key={chip.key} className="p-4 flex flex-col items-center gap-1.5 text-center min-w-0">
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

            <FadeIn delay={0.07}>
              <TodayPanel userId={user.id} strings={strings} locale={locale} initialTasks={top3List} />
            </FadeIn>

            {eventsCount > 0 && (
              <FadeIn delay={0.08}>
                <div className={`${cardBase} p-6`}>
                  <h2 className="font-display text-xl mb-3">{d.todayEvents}</h2>
                  <ul className="space-y-1.5 text-sm">
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

            {contentDueToday && contentDueToday.length > 0 && (
              <FadeIn delay={0.09}>
                <ContentDueToday items={contentDueToday} strings={strings} />
              </FadeIn>
            )}

          </div>

          {/* side column */}
          <div className="lg:col-span-4 lg:col-start-9 lg:row-start-1 space-y-6 min-w-0">
            <FadeIn delay={0.06}>
              <StreakCard streak={activityStreak} locale={locale} strings={d.streak} />
            </FadeIn>

            <FadeIn delay={0.07}>
              <HabitsToday userId={user.id} habits={habits || []} initialLogsToday={habitLogsToday || []} strings={strings} />
            </FadeIn>

            <FadeIn delay={0.08}>
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

            <FadeIn delay={0.09}>
              <Collapsible
                title={d.moreForToday}
                summary={restSummary}
                icon={
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-ink-muted dark:text-moon-muted">
                    <MoreHorizontal size={15} />
                  </span>
                }
              >
                <section className={`${cardBase} p-5 flex flex-wrap items-center gap-5`}>
                  <ProgressRing percent={progressPercent} size={64} stroke={5} />
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

                <MoodCheckin userId={user.id} initialMood={todayMood?.mood} strings={strings} />
                <CurrentlySection userId={user.id} initialItems={currentlyItems || []} strings={strings} />

                {onThisDay.length > 0 && (
                  <div className={`${cardBase} p-6`}>
                    <h2 className="font-display text-xl mb-3">{d.onThisDay}</h2>
                    <div className="space-y-3">
                      {onThisDay.map((n2, i) => (
                        <p key={i} className="text-sm leading-7">
                          <span className="text-ink-muted dark:text-moon-muted">
                            {n2.kind === "treasure" && "⭐ "}{new Date(n2.created_at).getFullYear()} —{" "}
                          </span>
                          {n2.content}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </Collapsible>
            </FadeIn>
          </div>
        </div>
      </main>
    </div>
  );
}
