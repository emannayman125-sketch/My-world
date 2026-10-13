import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import FadeIn from "@/components/FadeIn";

// ============================================================
// The public profile — "Quiet Editorial" redesign.
//
// Warm, light, personal-website-not-admin-dashboard direction, built to
// the exact reference palette: deep ink / warm paper / soft white /
// muted teal / burnished copper / soft sand / secondary text. These are
// one-off editorial colors used nowhere else in the app (the rest of
// the product keeps its own "Lantern Night" theme), so they're applied
// here as plain Tailwind arbitrary values rather than touched in
// tailwind.config.js — this page's look changes, nothing else's does.
//
// No fabricated photo in the hero: the brief for this page is explicit
// that a personal photograph must not be invented. The hero's visual
// side is an abstract, typographic composition in the same palette
// instead of a stock/staged photo.
//
// Same data, same RLS-protected queries as before (every table
// filtered .eq("is_public", true)) — only presentation changes.
// ============================================================

const INK = "#18201D";
const PAPER = "#F4F0E7";
const WHITE = "#FCFBF7";
const TEAL = "#3F706A";
const COPPER = "#A9694D";
const SAND = "#D8CCBC";
const MUTED = "#68736E";
const GOLD = "#C9A227"; // the one extra premium accent -- used sparingly, like lantern elsewhere in the app

// Real scanned covers he sent for books the free cover catalog can't
// match (Arabic titles). Checked before the live Open Library lookup.
const BOOK_COVER_OVERRIDES = {
  "مسلكيات": "/books/maslakiyat.jpg",
  "علو الهمة": "/books/oluw-al-himma.jpg",
  "رقائق القرآن": "/books/raqaiq-al-quran.jpg",
  "الطريق إلى القرآن": "/books/tariq-ila-quran.jpg",
  "الماجريات": "/books/al-majariyat.webp",
};

// Real cover art, looked up live from Open Library (a free, no-key
// catalog) by title/author, cached for a day per title so repeat visits
// don't re-fetch. Deliberately skipped for Arabic-script titles: that
// catalog is overwhelmingly English, so a "match" there is more likely
// to be a wrong book's cover than a right one -- and a wrong cover is
// worse than the plain fallback tile. On any failure (timeout, no
// match, API down) this just returns null and the fallback tile shows,
// exactly as before.
async function fetchCoverUrl(title, author) {
  if (/[؀-ۿ]/.test(title)) return null;
  try {
    const q = encodeURIComponent(`${title} ${author || ""}`.trim());
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`https://openlibrary.org/search.json?q=${q}&fields=cover_i&limit=1`, {
      signal: controller.signal,
      next: { revalidate: 60 * 60 * 24 },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const coverId = data?.docs?.[0]?.cover_i;
    return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
  } catch {
    return null;
  }
}

const SOCIAL_LABELS = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  x: "X",
  website: "Website",
};

function toHref(platform, value) {
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  const bases = {
    instagram: "https://instagram.com/",
    facebook: "https://facebook.com/",
    linkedin: "https://linkedin.com/in/",
    youtube: "https://youtube.com/@",
    tiktok: "https://tiktok.com/@",
    x: "https://x.com/",
    website: "https://",
  };
  return (bases[platform] || "https://") + value.replace(/^@/, "");
}

const CURRENTLY_ICON_PATHS = {
  reading: "M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13z",
  listening: "M4 13a8 8 0 0 1 16 0v4a2 2 0 0 1-2 2h-1v-6h3M4 17v-4h3v6H6a2 2 0 0 1-2-2z",
  watching: "M8 5v14l11-7z",
};

// All of this page's own chrome (not his data -- his bio, book titles,
// interests etc. stay exactly as he wrote them) in both languages.
// Picked by a plain ?lang=ar query param, server-rendered, no client
// JS -- the same safe pattern as the mobile menu and shelf accordion.
const T = {
  en: {
    dir: "ltr",
    menu: "Menu",
    langToggle: { en: "EN", ar: "AR" },
    nav: { currently: "Currently", books: "Reading", podcasts: "Listening", interests: "Interests", about: "About", social: "Links" },
    currentlyLabels: { reading: "Currently Reading", listening: "Currently Listening", watching: "Currently Watching" },
    kindSection: { music: "Also on Repeat", movie: "Watching", place: "Places on My Mind", hobby: "What I'm Into" },
    emptyNotes: {
      book: "The shelf is still taking shape.",
      interests: "A few favorites, coming soon.",
      social: "No links shared yet.",
    },
    hero: {
      eyebrow: (name) => `Hello, I'm ${name}`,
      headline: "What I read. What I listen to. What I'm becoming.",
      subtitle: "A living notebook of the pages, voices, and ideas quietly shaping who I'm becoming.",
      betterEveryDay: "Better Every Day",
    },
    sections: {
      currentlyTitle: "Currently",
      currentlySubtitle: "Where my attention lives this week.",
      booksTitle: "From the Shelf",
      booksSubtitle: "Stories I return to like old friends, and a few new ones I'm just getting to know.",
      podcastsTitle: "What I'm Listening To",
      podcastsSubtitle: "The voices that keep me company on long days and quiet drives.",
      podcastsEmptyTitle: "No listening items published yet.",
      podcastsEmptySubtitle: "Check back soon for podcasts and audio recommendations.",
      interestsTitle: "A Few Things I Love",
      interestsSubtitle: "The quiet threads woven through everything I build, read, and chase.",
      aboutTitle: "About Me",
      socialTitle: "Find Me Elsewhere",
      socialSubtitle: "If this page isn't enough, here's where the rest of me lives.",
    },
    footer: { tagline: "A small corner of the internet, kept just for the things I love." },
    worldName: (name) => `${name}'s World`,
  },
  ar: {
    dir: "rtl",
    menu: "القائمة",
    langToggle: { en: "EN", ar: "عربي" },
    nav: { currently: "حاليًا", books: "القراءة", podcasts: "الاستماع", interests: "الاهتمامات", about: "نبذة", social: "روابط" },
    currentlyLabels: { reading: "بيقرأ دلوقتي", listening: "بيسمع دلوقتي", watching: "بيتفرج دلوقتي" },
    kindSection: { music: "كمان بسمعه", movie: "بتفرج عليه", place: "أماكن في بالي", hobby: "حاجات بحبها" },
    emptyNotes: {
      book: "الرف لسه بيتجهز.",
      interests: "شوية حاجات بحبها، جاية قريبًا.",
      social: "لسه مفيش روابط.",
    },
    hero: {
      eyebrow: (name) => `أهلًا، أنا ${name}`,
      headline: "اللي بقراه. اللي بسمعه. اللي ببقى عليه.",
      subtitle: "دفتر صغير بيتجدد، فيه الصفحات والأصوات والأفكار اللي بتشكّلني يوم ورا يوم.",
      betterEveryDay: "كل يوم أحسن من اللي قبله",
    },
    sections: {
      currentlyTitle: "حاليًا",
      currentlySubtitle: "اللي شاغل بالي الفترة دي.",
      booksTitle: "من على الرف",
      booksSubtitle: "صفحات بارجعلها زي ما بارجع لصاحب قديم، وشوية لسه بتعرّف عليهم.",
      podcastsTitle: "إيه اللي بسمعه",
      podcastsSubtitle: "أصوات بتونسني في طريق طويل أو لحظة هدوء.",
      podcastsEmptyTitle: "لسه مفيش حاجة اتنشرت هنا.",
      podcastsEmptySubtitle: "تابعوا، هيبقى فيه بودكاست وتوصيات صوتية قريبًا.",
      interestsTitle: "حاجات بحبها",
      interestsSubtitle: "خيوط هادية ماشية في كل حاجة باعملها وباقراها وبالحقها.",
      aboutTitle: "نبذة عني",
      socialTitle: "تلاقيني كمان هنا",
      socialSubtitle: "لو الصفحة دي مش كفاية، هنا تقدر تلاقي باقي حكايتي.",
    },
    footer: { tagline: "ركن صغير في الإنترنت، محفوظ بس للحاجات اللي بحبها." },
    worldName: (name) => `عالم ${name}`,
  },
};

// One section shell used by every module below so the page reads as
// one deliberate system rather than several unrelated styles.
function Section({ id, title, subtitle, action, children }) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <span className="block w-8 h-[2px] mb-3 rounded-full" style={{ backgroundColor: GOLD }} aria-hidden="true" />
          <h2 className="font-display text-2xl sm:text-[1.75rem] leading-tight" style={{ color: INK }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: MUTED }}>
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// A deliberately designed "nothing here yet" state -- a dashed-edge
// card rather than bare italic text sitting on the page background,
// so a section with no content yet still reads as finished, not
// unbuilt. Used for the books/interests/social sections.
function EmptyState({ children }) {
  return (
    <div
      className="rounded-2xl px-6 py-9 text-center"
      style={{ border: `1px dashed ${SAND}`, backgroundColor: `${WHITE}80` }}
    >
      <span
        className="block w-6 h-[2px] mx-auto mb-3 rounded-full"
        style={{ backgroundColor: SAND }}
        aria-hidden="true"
      />
      <p className="text-sm italic" style={{ color: MUTED }}>
        {children}
      </p>
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-14px_rgba(24,32,29,0.28)] ${className}`}
      style={{ backgroundColor: WHITE, border: `1px solid ${SAND}` }}
    >
      {children}
    </div>
  );
}

async function getProfile(username) {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("public_profiles")
    .select("id, display_name, display_name_en, bio, avatar_url, social_links, public_section_order")
    .eq("username", username)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }) {
  const profile = await getProfile(params.username);
  if (!profile) return { title: "This page doesn't exist" };
  const name = profile.display_name_en || profile.display_name || "my";
  const description = profile.bio ? profile.bio.slice(0, 150) : `A personal space for ${name}'s interests, ideas, and everyday life.`;
  return {
    title: `${name}`,
    description,
    openGraph: { title: name, description, images: profile.avatar_url ? [{ url: profile.avatar_url }] : [] },
    twitter: { card: "summary", title: name, description, images: profile.avatar_url ? [profile.avatar_url] : [] },
  };
}

export default async function PublicProfilePage({ params, searchParams }) {
  const locale = searchParams?.lang === "ar" ? "ar" : "en";
  const t = T[locale];

  const supabase = createServerSupabase();
  const profile = await getProfile(params.username);
  if (!profile) notFound();

  const [{ data: interests }, { data: currently }, { data: world }] = await Promise.all([
    supabase.from("interests").select("*").eq("user_id", profile.id).eq("is_public", true),
    supabase.from("currently_items").select("*").eq("user_id", profile.id).eq("is_public", true),
    supabase.from("world_items").select("*").eq("user_id", profile.id).eq("is_public", true).order("created_at", { ascending: false }),
  ]);

  const worldByKind = {};
  for (const item of world || []) {
    worldByKind[item.kind] = worldByKind[item.kind] || [];
    worldByKind[item.kind].push(item);
  }

  // Shown as one flat, browsable shelf -- not grouped by category.
  const allBooks = worldByKind.book || [];

  // Real cover art per book: a hand-picked scan first (see
  // BOOK_COVER_OVERRIDES above), otherwise a live Open Library lookup
  // (see fetchCoverUrl), otherwise the plain tile fallback.
  const coverEntries = await Promise.all(
    allBooks.map(async (b) => [
      b.id,
      BOOK_COVER_OVERRIDES[b.title] || (await fetchCoverUrl(b.title, b.subtitle)),
    ])
  );
  const bookCovers = Object.fromEntries(coverEntries);

  const hasSocial = profile.social_links && Object.values(profile.social_links).some(Boolean);
  // Use the English name he set in Settings when viewing the English
  // page (so the hero doesn't read "Hello, I'm أحمد" in English), and
  // his main name on the Arabic page. Falls back to whichever name
  // exists if only one was ever set.
  const rawName =
    (locale === "en" && profile.display_name_en) ||
    profile.display_name ||
    profile.display_name_en ||
    "";
  const firstName = rawName.trim().split(/\s+/)[0] || (locale === "ar" ? "صديقي" : "Welcome");

  const DEFAULT_ORDER = ["currently", "books", "podcasts", "interests", "about", "social"];
  const configured = (profile.public_section_order || []).filter((k) => DEFAULT_ORDER.includes(k));
  const order = [...configured, ...DEFAULT_ORDER.filter((k) => !configured.includes(k))];

  const otherKinds = Object.entries(worldByKind).filter(([kind]) => kind !== "book" && kind !== "podcast");

  const hasContent = {
    currently: currently && currently.length > 0,
    books: (worldByKind.book?.length || 0) > 0,
    podcasts: (worldByKind.podcast?.length || 0) > 0,
    interests: interests && interests.length > 0,
    about: !!profile.bio,
    social: hasSocial,
  };
  const navItems = order.filter((k) => hasContent[k]);

  const sections = {
    currently: hasContent.currently ? (
      <Section id="currently" title={t.sections.currentlyTitle} subtitle={t.sections.currentlySubtitle}>
        <div className="grid sm:grid-cols-3 gap-4">
          {currently.map((c) => (
            <Card key={c.id}>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: SAND }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={INK}>
                    <path d={CURRENTLY_ICON_PATHS[c.kind] || CURRENTLY_ICON_PATHS.reading} />
                  </svg>
                </span>
                <p className="text-xs uppercase tracking-wide" style={{ color: COPPER }}>
                  {t.currentlyLabels[c.kind] || c.kind}
                </p>
              </div>
              <p className="font-display text-lg leading-snug" style={{ color: INK }}>
                {c.title}
              </p>
              {c.subtitle && (
                <p className="text-sm mt-1" style={{ color: MUTED }}>
                  {c.subtitle}
                </p>
              )}
              {typeof c.progress_percent === "number" && (
                <div className="mt-3">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: SAND }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${c.progress_percent}%`, backgroundColor: COPPER }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: MUTED }}>
                    {c.progress_percent}%
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </Section>
    ) : null,

    books: (
      <Section id="books" title={t.sections.booksTitle} subtitle={t.sections.booksSubtitle}>
        {allBooks.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-x-4 gap-y-7">
            {allBooks.map((b) => (
              <BookCover key={b.id} book={b} coverUrl={bookCovers[b.id]} />
            ))}
          </div>
        ) : (
          <EmptyState>{t.emptyNotes.book}</EmptyState>
        )}
      </Section>
    ),

    podcasts: (
      <Section id="podcasts" title={t.sections.podcastsTitle} subtitle={t.sections.podcastsSubtitle}>
        {worldByKind.podcast?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-5 gap-y-8">
            {worldByKind.podcast.map((w) => (
              <PodcastCover key={w.id} item={w} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-2xl px-6 py-9 text-center"
            style={{ border: `1px dashed ${SAND}`, backgroundColor: `${WHITE}80` }}
          >
            <span
              className="block w-6 h-[2px] mx-auto mb-3 rounded-full"
              style={{ backgroundColor: SAND }}
              aria-hidden="true"
            />
            <p className="text-sm" style={{ color: INK }}>
              {t.sections.podcastsEmptyTitle}
            </p>
            <p className="text-xs mt-1" style={{ color: MUTED }}>
              {t.sections.podcastsEmptySubtitle}
            </p>
          </div>
        )}
      </Section>
    ),

    interests: (
      <Section id="interests" title={t.sections.interestsTitle} subtitle={t.sections.interestsSubtitle}>
        {interests && interests.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {interests.map((i) => (
              <span
                key={i.id}
                className="rounded-full text-sm px-4 py-2 transition-colors hover:brightness-95"
                style={{ backgroundColor: SAND, color: INK }}
              >
                {i.value}
              </span>
            ))}
          </div>
        ) : (
          <EmptyState>{t.emptyNotes.interests}</EmptyState>
        )}
      </Section>
    ),

    about: hasContent.about ? (
      <Section id="about" title={t.sections.aboutTitle}>
        <Card className="relative overflow-hidden">
          <span
            className="font-display text-6xl leading-none select-none"
            style={{ color: GOLD, opacity: 0.55 }}
            aria-hidden="true"
          >
            &ldquo;
          </span>
          <p
            className="font-letter text-lg sm:text-xl leading-[1.8] whitespace-pre-wrap max-w-[65ch] -mt-4"
            style={{ color: INK }}
          >
            {profile.bio}
          </p>
        </Card>
      </Section>
    ) : null,

    social: (
      <Section id="social" title={t.sections.socialTitle} subtitle={t.sections.socialSubtitle}>
        {hasSocial ? (
          <div className="flex flex-wrap gap-6 sm:gap-8">
            {Object.entries(profile.social_links).map(([platform, value]) => {
              const href = toHref(platform, value);
              if (!href) return null;
              const label = platform === "website" ? (locale === "ar" ? "الموقع" : "Website") : SOCIAL_LABELS[platform] ?? platform;
              return (
                <a
                  key={platform}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
                  style={{ color: INK }}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: SAND }}
                  >
                    <SocialGlyph platform={platform} />
                  </span>
                  {label}
                </a>
              );
            })}
          </div>
        ) : (
          <EmptyState>{t.emptyNotes.social}</EmptyState>
        )}
      </Section>
    ),
  };

  // Toggle keeps whatever section the person is already looking at.
  const otherLocale = locale === "ar" ? "en" : "ar";

  return (
    <main
      dir={t.dir}
      lang={locale}
      className="min-h-screen"
      style={{ backgroundColor: PAPER, color: INK, fontFamily: "var(--font-body), sans-serif" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 backdrop-blur-md"
        style={{ backgroundColor: `${WHITE}E6`, borderBottom: `1px solid ${SAND}` }}
      >
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between gap-6 py-4">
          <span className="font-display text-lg shrink-0" style={{ color: INK }}>
            {t.worldName(firstName)}
          </span>

          <div className="flex items-center gap-3">
            {navItems.length > 1 && (
              <>
                {/* Desktop/tablet: inline pill nav. */}
                <nav className="hidden sm:flex items-center gap-1">
                  {navItems.map((key) => (
                    <a
                      key={key}
                      href={`#${key}`}
                      className="shrink-0 text-sm px-3 py-1.5 rounded-full hover:opacity-70 transition-opacity"
                      style={{ color: MUTED }}
                    >
                      {t.nav[key]}
                    </a>
                  ))}
                </nav>

                {/* Mobile: a native <details> menu -- no client JS needed,
                    so this page can stay a plain server component. */}
                <details className="sm:hidden relative">
                  <summary
                    className="list-none flex h-9 w-9 items-center justify-center rounded-full cursor-pointer"
                    style={{ backgroundColor: SAND }}
                    aria-label={t.menu}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round">
                      <path d="M4 7h16M4 12h16M4 17h16" />
                    </svg>
                  </summary>
                  <nav
                    className="absolute end-0 mt-2 w-48 rounded-xl p-2 shadow-lg"
                    style={{ backgroundColor: WHITE, border: `1px solid ${SAND}` }}
                  >
                    {navItems.map((key) => (
                      <a
                        key={key}
                        href={`#${key}`}
                        className="block text-sm px-3 py-2 rounded-lg hover:opacity-70 transition-opacity"
                        style={{ color: INK }}
                      >
                        {t.nav[key]}
                      </a>
                    ))}
                  </nav>
                </details>
              </>
            )}

            {/* Language toggle -- a plain link, no client JS: the whole
                page re-renders server-side in the other language. */}
            <a
              href={`?lang=${otherLocale}`}
              className="shrink-0 text-xs font-medium rounded-full px-3 py-1.5 transition-colors"
              style={{ backgroundColor: SAND, color: INK }}
            >
              {T[otherLocale].langToggle[otherLocale]}
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <FadeIn>
          <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-10 items-center py-14 sm:py-20">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] mb-4" style={{ color: COPPER }}>
                {t.hero.eyebrow(firstName)}
              </p>
              <h1 className="font-display text-4xl sm:text-5xl leading-[1.2] max-w-[16ch]" style={{ color: INK }}>
                {t.hero.headline}
              </h1>
              <p className="text-base mt-5 max-w-[42ch]" style={{ color: MUTED }}>
                {t.hero.subtitle}
              </p>

              {hasSocial && (
                <div className="flex gap-3 mt-7">
                  {Object.entries(profile.social_links).map(([platform, value]) => {
                    const href = toHref(platform, value);
                    if (!href) return null;
                    return (
                      <a
                        key={platform}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        aria-label={SOCIAL_LABELS[platform] ?? platform}
                        className="flex h-9 w-9 items-center justify-center rounded-full hover:opacity-70 transition-opacity"
                        style={{ backgroundColor: SAND }}
                      >
                        <SocialGlyph platform={platform} />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* His real photo when he's set one in Profile settings;
                otherwise an abstract editorial composition rather than
                an invented personal photo. */}
            {profile.avatar_url ? (
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] md:aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name || firstName}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(0deg, ${INK}66 0%, transparent 35%)` }}
                  aria-hidden="true"
                />
                <p
                  className="absolute top-7 end-7 text-xs tracking-[0.15em]"
                  style={{ color: `${WHITE}E6`, writingMode: "vertical-rl" }}
                >
                  {t.hero.betterEveryDay}
                </p>
              </div>
            ) : (
              <div
                className="relative rounded-3xl overflow-hidden aspect-[4/3] md:aspect-square"
                style={{ background: `linear-gradient(145deg, ${TEAL} 0%, ${INK} 100%)` }}
              >
                {/* A quiet emblem, not a chart, and no literal letter --
                    a radiant texture behind a fine hand-drawn rosette,
                    the kind of restrained geometric ornament that sits
                    comfortably next to the Arabic titles on this page. */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `radial-gradient(circle at 20% 15%, ${GOLD}33, transparent 40%), radial-gradient(circle at 85% 85%, ${COPPER}44, transparent 45%)`,
                  }}
                  aria-hidden="true"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    width="168"
                    height="168"
                    viewBox="0 0 168 168"
                    fill="none"
                    aria-hidden="true"
                    className="w-32 h-32 sm:w-40 sm:h-40"
                  >
                    <circle cx="84" cy="84" r="82" stroke={`${GOLD}66`} strokeWidth="1" />
                    <circle cx="84" cy="84" r="58" stroke={`${GOLD}99`} strokeWidth="1" />
                    {Array.from({ length: 8 }).map((_, i) => {
                      const angle = (i * Math.PI) / 4;
                      const x = 84 + 58 * Math.cos(angle);
                      const y = 84 + 58 * Math.sin(angle);
                      return (
                        <circle key={i} cx={x} cy={y} r="27" stroke={`${GOLD}55`} strokeWidth="0.75" />
                      );
                    })}
                    <circle cx="84" cy="84" r="4" fill={`${GOLD}CC`} />
                  </svg>
                </div>
                <p
                  className="absolute top-7 end-7 text-xs tracking-[0.15em]"
                  style={{ color: `${WHITE}CC`, writingMode: "vertical-rl" }}
                >
                  {t.hero.betterEveryDay}
                </p>
              </div>
            )}
          </div>
        </FadeIn>

        {/* Sections */}
        <div className="space-y-16 sm:space-y-20 pb-20">
          {order.map((key, i) =>
            sections[key] ? (
              <FadeIn key={key} delay={0.05 + i * 0.04}>
                {sections[key]}
              </FadeIn>
            ) : null
          )}

          {otherKinds.map(([kind, items], idx) => {
            const meta = { title: t.kindSection[kind] || kind };
            return (
              <FadeIn key={kind} delay={0.3 + idx * 0.04}>
                <Section title={meta.title}>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {items.map((w) => (
                      <Card key={w.id}>
                        <p className="font-display text-base leading-snug" style={{ color: INK }}>
                          {w.title}
                        </p>
                        {w.subtitle && (
                          <p className="text-sm mt-1" style={{ color: MUTED }}>
                            {w.subtitle}
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>
                </Section>
              </FadeIn>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: INK }}>
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display text-base" style={{ color: WHITE }}>
              {t.worldName(firstName)}
            </p>
            <p className="text-sm mt-1" style={{ color: `${WHITE}99` }}>
              {t.footer.tagline}
            </p>
          </div>
          {navItems.length > 0 && (
            <nav className="flex flex-wrap gap-x-5 gap-y-2">
              {navItems.map((key) => (
                <a
                  key={key}
                  href={`#${key}`}
                  className="text-sm hover:opacity-70 transition-opacity"
                  style={{ color: `${WHITE}CC` }}
                >
                  {t.nav[key]}
                </a>
              ))}
            </nav>
          )}
        </div>
      </footer>
    </main>
  );
}

// Minimal inline glyphs so the social row doesn't depend on importing a
// whole icon library's worth of brand marks for six platforms.
const SPINE_TONES = [TEAL, COPPER, INK, MUTED];

function hashTitle(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// A plain, server-rendered "book cover" tile — no client state needed,
// so this stays part of the same file as the rest of the (server
// component) page instead of a separate component file.
function BookCover({ book, coverUrl }) {
  const tone = SPINE_TONES[hashTitle(book.title) % SPINE_TONES.length];
  return (
    <div className="group">
      <div className="aspect-[2/3] rounded-md overflow-hidden shadow-[0_6px_16px_-6px_rgba(24,32,29,0.25)] transition-transform duration-300 group-hover:-translate-y-1">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt={book.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-end p-2.5" style={{ backgroundColor: tone }}>
            <span className="font-display text-[11px] leading-tight" style={{ color: WHITE }}>
              {book.title}
            </span>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-[11px] truncate" style={{ color: MUTED }}>
        {book.subtitle || ""}
      </p>
      {book.review && (
        <p className="mt-0.5 text-[11px] italic leading-snug line-clamp-2" style={{ color: INK }}>
          &ldquo;{book.review}&rdquo;
        </p>
      )}
    </div>
  );
}

// Same cover-tile treatment as the books, with a small play glyph badge
// when the podcast has a real external link to open.
function PodcastCover({ item }) {
  const tone = SPINE_TONES[hashTitle(item.title) % SPINE_TONES.length];
  const href = item.link_url && /^https?:\/\//.test(item.link_url) ? item.link_url : null;
  const Wrapper = href ? "a" : "div";
  return (
    <Wrapper {...(href ? { href, target: "_blank", rel: "noopener noreferrer nofollow" } : {})} className="block group">
      <div
        className="relative aspect-square rounded-xl shadow-[0_6px_16px_-6px_rgba(24,32,29,0.25)] flex items-end p-3 transition-transform group-hover:-translate-y-1"
        style={{ backgroundColor: tone }}
      >
        <span className="font-display text-[13px] leading-tight" style={{ color: WHITE }}>
          {item.title}
        </span>
        {href && (
          <span
            className="absolute top-2.5 end-2.5 flex h-6 w-6 items-center justify-center rounded-full"
            style={{ backgroundColor: `${WHITE}E6` }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill={INK}>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        )}
      </div>
      <p className="mt-2 text-xs truncate" style={{ color: MUTED }}>
        {item.subtitle || ""}
      </p>
    </Wrapper>
  );
}

function SocialGlyph({ platform }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: INK, strokeWidth: 1.8 };
  switch (platform) {
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill={INK} stroke="none" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path d="M14 21v-7h2.5l.5-3H14V9c0-.9.3-1.5 1.7-1.5H17V4.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V11H8v3h2.8v7H14z" fill={INK} stroke="none" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M7.5 10v7M7.5 7v.01M12 17v-4.5c0-1.4 1-2.5 2.3-2.5 1.3 0 2.2 1 2.2 2.5V17" strokeLinecap="round" />
        </svg>
      );
    case "youtube":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="12" rx="4" />
          <path d="M10.5 9.5l5 2.5-5 2.5z" fill={INK} stroke="none" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <path d="M14 4v10.5a3 3 0 1 1-2.5-3V9a5.3 5.3 0 0 0 2.5 7.5 5.3 5.3 0 0 0 5.3-5.3V7.6A6 6 0 0 0 17 4h-3z" fill={INK} stroke="none" />
        </svg>
      );
    case "x":
      return (
        <svg {...common}>
          <path d="M5 5l14 14M19 5L5 19" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
        </svg>
      );
  }
}
