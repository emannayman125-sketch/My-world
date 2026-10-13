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
  "سلطة الثقافة الغالبة": "/books/sultat-al-thaqafa-al-ghaliba.jpg",
  "مدارج السالكين": "/books/madarij-al-salikin.jpg",
  "الداء والدواء": "/books/al-daa-wal-dawaa.jpg",
  "The Personal MBA": "/books/personal-mba.png",
  "Digital Minimalism": "/books/digital-minimalism.jpg",
  "The E-Myth Revisited": "/books/e-myth-revisited.jpg",
  "The Essays of Warren Buffett": "/books/essays-of-warren-buffett.jpg",
  "Warren Buffett and the Interpretation of Financial Statements": "/books/warren-buffett-interpretation.jpg",
};

// Real cover art, looked up live from two free, no-key catalogs by
// title/author, cached for a day per title so repeat visits don't
// re-fetch. Deliberately skipped for Arabic-script titles: both
// catalogs are overwhelmingly English, so a "match" there is more
// likely to be a wrong book's cover than a right one -- and a wrong
// cover is worse than the plain fallback tile. On any failure (timeout,
// no match, API down) this just returns null and the fallback tile
// shows, exactly as before.
async function fetchFromOpenLibrary(title, author) {
  const q = encodeURIComponent(`${title} ${author || ""}`.trim());
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=${q}&fields=cover_i&limit=1`, {
      signal: controller.signal,
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const coverId = data?.docs?.[0]?.cover_i;
    return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Second source for titles Open Library doesn't have -- real covers
// only, same rule as above (never a guessed/fabricated image).
async function fetchFromGoogleBooks(title, author) {
  const q = encodeURIComponent(`intitle:${title}${author ? ` inauthor:${author}` : ""}`);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`, {
      signal: controller.signal,
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const thumb = data?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
    return thumb ? thumb.replace(/^http:/, "https:") : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchCoverUrl(title, author) {
  if (/[؀-ۿ]/.test(title)) return null;
  return (await fetchFromOpenLibrary(title, author)) || (await fetchFromGoogleBooks(title, author));
}

// Real podcast/show artwork from Apple's free, no-key search API. Same
// rules as the book covers: skipped for Arabic titles (too likely to
// match the wrong show), null on any failure, never a guess.
async function fetchPodcastArt(title) {
  if (/[؀-ۿ]/.test(title)) return null;
  const q = encodeURIComponent(title);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${q}&media=podcast&limit=1`, {
      signal: controller.signal,
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const art = data?.results?.[0]?.artworkUrl600 || data?.results?.[0]?.artworkUrl100;
    return art || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
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

// A distinct accent (from the page's own palette, not a brand color)
// per platform, so the social cards read as a lively set rather than
// one repeated grey tile.
const SOCIAL_ACCENTS = {
  instagram: COPPER,
  facebook: TEAL,
  linkedin: INK,
  youtube: COPPER,
  tiktok: INK,
  x: TEAL,
  website: GOLD,
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
      booksAllLabel: "All",
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
    socialDescriptors: {
      instagram: "Photos & moments",
      facebook: "Updates & posts",
      linkedin: "Professional network",
      youtube: "Videos & ideas",
      tiktok: "Short clips",
      x: "Thoughts & updates",
      website: "More, in one place",
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
      booksAllLabel: "الكل",
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
    socialDescriptors: {
      instagram: "صور ولحظات",
      facebook: "أخبار ومنشورات",
      linkedin: "شبكتي المهنية",
      youtube: "فيديوهات وأفكار",
      tiktok: "مقاطع قصيرة",
      x: "أفكار وتحديثات",
      website: "كل حاجة في مكان واحد",
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
          <span
            className="block w-10 h-[3px] mb-3 rounded-full"
            style={{ backgroundImage: `linear-gradient(90deg, ${GOLD} 0%, ${COPPER} 100%)` }}
            aria-hidden="true"
          />
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

  // Real categories only -- the "notes" field he actually picked for
  // each book when it was added (e.g. "الإيمان والتأمل", "تركيز ونمو"),
  // never invented. Turned into CSS-only tabs below (no client JS):
  // each tab is a plain #hash link, and a few generated :target rules
  // show the matching panel -- the same safe-HTML-trick family as the
  // mobile menu and book-review disclosure elsewhere on this page.
  const bookCategories = Array.from(new Set(allBooks.map((b) => b.notes).filter(Boolean)));
  const bookCategorySlug = (cat) => `bc${bookCategories.indexOf(cat)}`;

  // Real podcast artwork, same real-source-only rule as the books.
  const podcastList = worldByKind.podcast || [];
  const podcastCoverEntries = await Promise.all(
    podcastList.map(async (p) => [p.id, await fetchPodcastArt(p.title)])
  );
  const podcastCovers = Object.fromEntries(podcastCoverEntries);

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
                      style={{
                        "--target-width": `${c.progress_percent}%`,
                        width: 0,
                        backgroundColor: COPPER,
                        animation: "ahmedworld-fill 1.1s ease-out forwards",
                      }}
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
          <>
            {bookCategories.length > 1 && (
              <>
                {/* Real categories only (his own "notes" field on each
                    book) -- plain #hash tabs, shown/hidden by the
                    generated :target rules below. No client JS. */}
                <style>{`
                  .book-tab-panel { display: none; }
                  #book-cat-all { display: block; }
                  .book-tab-panel:target { display: block; }
                  ${bookCategories
                    .map((cat) => `#book-cat-${bookCategorySlug(cat)}:target ~ #book-cat-all { display: none; }`)
                    .join("\n")}
                `}</style>
                <nav className="flex flex-wrap items-center gap-1 mb-5 -mt-1">
                  <a
                    href="#book-cat-all"
                    className="text-xs sm:text-sm px-3 py-1.5 rounded-full transition-colors hover:bg-[color:var(--sand)]"
                    style={{ color: MUTED, "--sand": SAND }}
                  >
                    {t.sections.booksAllLabel}
                  </a>
                  {bookCategories.map((cat) => (
                    <a
                      key={cat}
                      href={`#book-cat-${bookCategorySlug(cat)}`}
                      className="text-xs sm:text-sm px-3 py-1.5 rounded-full transition-colors hover:bg-[color:var(--sand)]"
                      style={{ color: MUTED, "--sand": SAND }}
                    >
                      {cat}
                    </a>
                  ))}
                </nav>
              </>
            )}

            <div className="relative">
              <div id="book-cat-all" className="book-tab-panel">
                <BookRow books={allBooks} covers={bookCovers} />
              </div>
              {bookCategories.map((cat) => (
                <div key={cat} id={`book-cat-${bookCategorySlug(cat)}`} className="book-tab-panel">
                  <BookRow books={allBooks.filter((b) => b.notes === cat)} covers={bookCovers} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState>{t.emptyNotes.book}</EmptyState>
        )}
      </Section>
    ),

    podcasts: (
      <Section id="podcasts" title={t.sections.podcastsTitle} subtitle={t.sections.podcastsSubtitle}>
        {podcastList.length > 0 ? (
          <ScrollRow
            items={podcastList}
            itemWidth={132}
            rowHeight={158}
            renderItem={(w) => <PodcastCover item={w} coverUrl={podcastCovers[w.id]} />}
          />
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
                className="rounded-full text-sm px-4 py-2 transition-all duration-300 hover:brightness-95 hover:-translate-y-0.5 hover:shadow-[0_6px_14px_-8px_rgba(24,32,29,0.35)]"
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {Object.entries(profile.social_links).map(([platform, value]) => {
              const href = toHref(platform, value);
              if (!href) return null;
              const label = platform === "website" ? (locale === "ar" ? "الموقع" : "Website") : SOCIAL_LABELS[platform] ?? platform;
              const accent = SOCIAL_ACCENTS[platform] || INK;
              const descriptor = t.socialDescriptors[platform] || t.socialDescriptors.website;
              return (
                <a
                  key={platform}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="group/social flex items-center gap-3 rounded-2xl p-3.5 transition-all duration-300 hover:-translate-y-0.5"
                  style={{ backgroundColor: WHITE, border: `1px solid ${SAND}` }}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover/social:scale-110 group-hover/social:-rotate-6"
                    style={{ backgroundColor: accent }}
                  >
                    <SocialGlyph platform={platform} color={WHITE} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium truncate" style={{ color: INK }}>
                      {label}
                    </span>
                    <span className="block text-[11px] truncate" style={{ color: MUTED }}>
                      {descriptor}
                    </span>
                  </span>
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
      {/* Small, purely-CSS motion -- no client JS, same safe pattern as
          the rest of this page. Keeps the page feeling alive: the hero
          ornament turns slowly, and progress bars fill in on load. */}
      <style>{`
        @keyframes ahmedworld-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ahmedworld-fill { from { width: 0%; } to { width: var(--target-width); } }
        @keyframes ahmedworld-steam {
          0%, 100% { transform: translateY(0); opacity: 0.55; }
          50% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>

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
                      className="shrink-0 text-sm px-3 py-1.5 rounded-full transition-all duration-300 hover:text-[color:var(--ink)] hover:bg-[color:var(--sand)]"
                      style={{ color: MUTED, "--ink": INK, "--sand": SAND }}
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
                        className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 hover:opacity-80 hover:scale-110 hover:-rotate-6"
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
                {/* No invented personal photo -- an original, drawn
                    scene instead (a stack of books, a plant, a cup),
                    not a photograph of him or his actual desk, so it
                    reads as an editorial illustration rather than a
                    fabricated memory. */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `radial-gradient(circle at 18% 12%, ${GOLD}2e, transparent 42%), radial-gradient(circle at 88% 20%, ${COPPER}3a, transparent 48%)`,
                  }}
                  aria-hidden="true"
                />
                <svg
                  viewBox="0 0 300 300"
                  preserveAspectRatio="xMidYMax slice"
                  className="absolute inset-0 w-full h-full"
                  aria-hidden="true"
                >
                  {/* sun */}
                  <circle cx="235" cy="70" r="46" fill={`${GOLD}26`} />
                  <circle cx="235" cy="70" r="24" fill={`${GOLD}40`} />
                  {/* book stack */}
                  <g transform="rotate(-2 95 226)">
                    <rect x="30" y="214" width="160" height="24" rx="3" fill={COPPER} />
                  </g>
                  <g transform="rotate(1.5 95 198)">
                    <rect x="38" y="188" width="142" height="24" rx="3" fill={WHITE} opacity="0.92" />
                    <rect x="50" y="196" width="100" height="3" rx="1.5" fill={INK} opacity="0.35" />
                  </g>
                  <g transform="rotate(-1 95 172)">
                    <rect x="28" y="162" width="150" height="24" rx="3" fill={GOLD} opacity="0.85" />
                  </g>
                  {/* plant */}
                  <path d="M208 160 Q198 118 214 96 Q222 124 214 160 Z" fill={`${TEAL}`} opacity="0.9" />
                  <path d="M214 160 Q214 110 236 92 Q232 126 218 160 Z" fill={`${TEAL}`} opacity="0.7" />
                  <path d="M214 160 Q222 120 246 108 Q234 134 218 160 Z" fill={`${TEAL}`} opacity="0.55" />
                  <path d="M196 160 h40 l-5 18 a2 2 0 0 1 -2 2 h-26 a2 2 0 0 1 -2 -2 Z" fill={SAND} />
                  {/* cup */}
                  <ellipse cx="258" cy="168" rx="20" ry="7" fill={INK} opacity="0.18" />
                  <rect x="240" y="146" width="36" height="24" rx="6" fill={PAPER} opacity="0.95" />
                  <path d="M276 150 q14 2 10 14 q-3 9 -12 8" fill="none" stroke={PAPER} strokeWidth="4" opacity="0.95" />
                  <path
                    d="M248 138 q4 -8 0 -14 M258 138 q4 -8 0 -14 M268 138 q4 -8 0 -14"
                    fill="none"
                    stroke={`${WHITE}AA`}
                    strokeWidth="2"
                    strokeLinecap="round"
                    style={{ animation: "ahmedworld-steam 3.5s ease-in-out infinite" }}
                  />
                </svg>
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
                  className="relative text-sm after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-current after:transition-all after:duration-300 hover:opacity-100 hover:after:w-full transition-opacity"
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
const SPINE_TONES = [TEAL, COPPER, INK, GOLD];

function hashTitle(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// A plain, server-rendered "book cover" tile — no client state needed,
// so this stays part of the same file as the rest of the (server
// component) page instead of a separate component file.
// A horizontally-scrolling shelf with a round arrow at the end -- a
// visual hint that there's more to see, swipeable on touch and
// scrollable with a trackpad/shift+wheel on desktop (plain CSS
// overflow, no JS needed to make it work).
// A horizontally-scrolling row with a round arrow at the end -- a
// visual hint that there's more to see, swipeable on touch and
// scrollable with a trackpad/shift+wheel on desktop (plain CSS
// overflow, no JS needed to make it work). Shared by the books shelf
// and the podcast row.
function ScrollRow({ items, itemWidth, rowHeight, renderItem }) {
  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto pb-2 pe-14 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <div key={item.id} className="shrink-0 snap-start" style={{ width: itemWidth }}>
            {renderItem(item)}
          </div>
        ))}
      </div>
      {items.length > 5 && (
        <span
          aria-hidden="true"
          className="hidden sm:flex absolute end-0 top-0 items-center justify-center rounded-full"
          style={{
            height: rowHeight,
            width: 48,
            background: `linear-gradient(90deg, transparent 0%, ${PAPER} 55%)`,
          }}
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full shadow-[0_4px_10px_-4px_rgba(24,32,29,0.35)]"
            style={{ backgroundColor: WHITE, border: `1px solid ${SAND}` }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </span>
        </span>
      )}
    </div>
  );
}

function BookRow({ books, covers }) {
  return (
    <ScrollRow
      items={books}
      itemWidth={108}
      rowHeight={162}
      renderItem={(b) => <BookCover book={b} coverUrl={covers[b.id]} />}
    />
  );
}

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
        // A native <details> trick, same family as the mobile menu: the
        // quote shows clamped to 2 lines, and clicking it opens to the
        // full review -- no JS needed for the click-to-expand feel.
        // Styled as a small quote callout (gold mark + hairline rule)
        // rather than plain italic text.
        <details className="mt-1.5 ps-2 [&[open]_summary]:line-clamp-none" style={{ borderInlineStart: `2px solid ${GOLD}66` }}>
          <summary className="list-none cursor-pointer marker:content-none">
            <span className="font-display text-sm leading-none align-top" style={{ color: GOLD }}>
              &ldquo;
            </span>{" "}
            <span className="text-[11px] italic leading-snug line-clamp-2" style={{ color: INK }}>
              {book.review}
            </span>
          </summary>
        </details>
      )}
    </div>
  );
}

// Real artwork (see fetchPodcastArt) when there's a match, otherwise a
// gradient tile in one of the richer accent tones -- same play glyph
// badge when the podcast has a real external link to open.
function PodcastCover({ item, coverUrl }) {
  const tone = SPINE_TONES[hashTitle(item.title) % SPINE_TONES.length];
  const href = item.link_url && /^https?:\/\//.test(item.link_url) ? item.link_url : null;
  const Wrapper = href ? "a" : "div";
  return (
    <Wrapper {...(href ? { href, target: "_blank", rel: "noopener noreferrer nofollow" } : {})} className="block group">
      <div
        className="relative aspect-square rounded-xl overflow-hidden shadow-[0_6px_16px_-6px_rgba(24,32,29,0.25)] flex items-end p-3 transition-transform group-hover:-translate-y-1"
        style={coverUrl ? undefined : { backgroundImage: `linear-gradient(155deg, ${tone} 0%, ${INK} 130%)` }}
      >
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt={item.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        ) : null}
        {coverUrl && (
          <span className="absolute inset-0" style={{ background: `linear-gradient(0deg, ${INK}99 0%, transparent 45%)` }} aria-hidden="true" />
        )}
        <span className="relative font-display text-[13px] leading-tight" style={{ color: WHITE }}>
          {item.title}
        </span>
        {href && (
          <span
            className="absolute top-2.5 end-2.5 flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
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

function SocialGlyph({ platform, color = INK }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8 };
  switch (platform) {
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill={color} stroke="none" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path d="M14 21v-7h2.5l.5-3H14V9c0-.9.3-1.5 1.7-1.5H17V4.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V11H8v3h2.8v7H14z" fill={color} stroke="none" />
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
          <path d="M10.5 9.5l5 2.5-5 2.5z" fill={color} stroke="none" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <path d="M14 4v10.5a3 3 0 1 1-2.5-3V9a5.3 5.3 0 0 0 2.5 7.5 5.3 5.3 0 0 0 5.3-5.3V7.6A6 6 0 0 0 17 4h-3z" fill={color} stroke="none" />
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
