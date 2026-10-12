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

const KIND_SECTION = {
  music: { title: "Also on Repeat" },
  movie: { title: "Watching" },
  place: { title: "Places on My Mind" },
  hobby: { title: "What I'm Into" },
};

const EMPTY_NOTES = {
  book: "The shelf is still taking shape.",
  podcast: "No listening items published yet.",
  interests: "A few favorites, coming soon.",
  social: "No links shared yet.",
};

const NAV_LABELS = {
  currently: "Currently",
  books: "Reading",
  podcasts: "Listening",
  interests: "Interests",
  about: "About",
  social: "Links",
};

const CURRENTLY_LABELS = {
  reading: "Currently Reading",
  listening: "Currently Listening",
  watching: "Currently Watching",
};

// One section shell used by every module below so the page reads as
// one deliberate system rather than several unrelated styles.
function Section({ id, title, subtitle, action, children }) {
  return (
    <section id={id} className="scroll-mt-28">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
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

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
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
    .select("id, display_name, bio, avatar_url, social_links, public_section_order")
    .eq("username", username)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }) {
  const profile = await getProfile(params.username);
  if (!profile) return { title: "This page doesn't exist" };
  const name = profile.display_name || "my";
  const description = profile.bio ? profile.bio.slice(0, 150) : `A personal space for ${name}'s interests, ideas, and everyday life.`;
  return {
    title: `${name}`,
    description,
    openGraph: { title: name, description, images: profile.avatar_url ? [{ url: profile.avatar_url }] : [] },
    twitter: { card: "summary", title: name, description, images: profile.avatar_url ? [profile.avatar_url] : [] },
  };
}

export default async function PublicProfilePage({ params }) {
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

  // Books carry their category in `notes` (reusing the existing column
  // — no schema change needed), grouped shelf-by-shelf below.
  const booksByCategory = new Map();
  for (const b of worldByKind.book || []) {
    const cat = (b.notes || "").trim() || "Books";
    if (!booksByCategory.has(cat)) booksByCategory.set(cat, []);
    booksByCategory.get(cat).push(b);
  }

  const hasSocial = profile.social_links && Object.values(profile.social_links).some(Boolean);
  const firstName = (profile.display_name || "").trim().split(/\s+/)[0] || "Welcome";

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
      <Section id="currently" title="Currently" subtitle="What I'm focused on right now.">
        <div className="grid sm:grid-cols-3 gap-4">
          {currently.map((c) => (
            <Card key={c.id}>
              <p className="text-xs uppercase tracking-wide mb-2" style={{ color: COPPER }}>
                {CURRENTLY_LABELS[c.kind] || c.kind}
              </p>
              <p className="font-display text-lg leading-snug" style={{ color: INK }}>
                {c.title}
              </p>
              {c.subtitle && (
                <p className="text-sm mt-1" style={{ color: MUTED }}>
                  {c.subtitle}
                </p>
              )}
            </Card>
          ))}
        </div>
      </Section>
    ) : null,

    books: (
      <Section id="books" title="From the Shelf" subtitle="A curated collection of books, ideas and perspectives.">
        {booksByCategory.size > 0 ? (
          <div className="space-y-8">
            {[...booksByCategory.entries()].map(([category, books]) => (
              <div key={category}>
                <span
                  className="inline-block text-xs uppercase tracking-wide rounded-full px-3 py-1 mb-4"
                  style={{ backgroundColor: SAND, color: INK }}
                >
                  {category}
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-5 gap-y-8">
                  {books.map((b) => (
                    <BookCover key={b.id} book={b} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm italic" style={{ color: MUTED }}>
            {EMPTY_NOTES.book}
          </p>
        )}
      </Section>
    ),

    podcasts: (
      <Section id="podcasts" title="What I'm Listening To" subtitle="Podcasts, audiobooks and ideas worth hearing.">
        {worldByKind.podcast?.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            {worldByKind.podcast.map((w) => {
              const href = w.link_url && /^https?:\/\//.test(w.link_url) ? w.link_url : null;
              const Wrapper = href ? "a" : "div";
              return (
                <Wrapper
                  key={w.id}
                  {...(href ? { href, target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
                  className="block"
                >
                  <Card className={href ? "hover:border-[#A9694D] transition-colors" : ""}>
                    <p className="font-display text-base leading-snug" style={{ color: INK }}>
                      {w.title}
                    </p>
                    {w.subtitle && (
                      <p className="text-sm mt-1" style={{ color: MUTED }}>
                        {w.subtitle}
                      </p>
                    )}
                  </Card>
                </Wrapper>
              );
            })}
          </div>
        ) : (
          <Card className="text-center py-10">
            <p className="text-sm" style={{ color: INK }}>
              No listening items published yet.
            </p>
            <p className="text-xs mt-1" style={{ color: MUTED }}>
              Check back soon for podcasts and audio recommendations.
            </p>
          </Card>
        )}
      </Section>
    ),

    interests: (
      <Section id="interests" title="A Few Things I Love" subtitle="The topics, hobbies and subjects that excite me.">
        {interests && interests.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {interests.map((i) => (
              <span
                key={i.id}
                className="rounded-full text-sm px-4 py-2"
                style={{ backgroundColor: SAND, color: INK }}
              >
                {i.value}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm italic" style={{ color: MUTED }}>
            {EMPTY_NOTES.interests}
          </p>
        )}
      </Section>
    ),

    about: hasContent.about ? (
      <Section id="about" title="About">
        <p className="font-letter text-lg sm:text-xl leading-[1.9] whitespace-pre-wrap max-w-[65ch]" style={{ color: INK }}>
          {profile.bio}
        </p>
      </Section>
    ) : null,

    social: (
      <Section id="social" title="Find Me Elsewhere" subtitle="Let's connect.">
        {hasSocial ? (
          <div className="flex flex-wrap gap-6 sm:gap-8">
            {Object.entries(profile.social_links).map(([platform, value]) => {
              const href = toHref(platform, value);
              if (!href) return null;
              const label = SOCIAL_LABELS[platform] ?? platform;
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
          <p className="text-sm italic" style={{ color: MUTED }}>
            {EMPTY_NOTES.social}
          </p>
        )}
      </Section>
    ),
  };

  return (
    <main
      dir="ltr"
      lang="en"
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
            {firstName}'s World
          </span>
          {navItems.length > 1 && (
            <nav className="flex items-center gap-1 overflow-x-auto whitespace-nowrap">
              {navItems.map((key) => (
                <a
                  key={key}
                  href={`#${key}`}
                  className="shrink-0 text-sm px-3 py-1.5 rounded-full hover:opacity-70 transition-opacity"
                  style={{ color: MUTED }}
                >
                  {NAV_LABELS[key]}
                </a>
              ))}
            </nav>
          )}
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6">
        {/* Hero */}
        <FadeIn>
          <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-10 items-center py-14 sm:py-20">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] mb-4" style={{ color: COPPER }}>
                Hello, I'm {firstName}
              </p>
              <h1 className="font-display text-4xl sm:text-5xl leading-[1.2] max-w-[16ch]" style={{ color: INK }}>
                What I read. What I listen to. What I'm becoming.
              </h1>
              <p className="text-base mt-5 max-w-[42ch]" style={{ color: MUTED }}>
                A small collection of the things that shape my world.
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
                  Better Every Day
                </p>
              </div>
            ) : (
              <div
                className="relative rounded-3xl overflow-hidden aspect-[4/3] md:aspect-square"
                style={{ background: `linear-gradient(145deg, ${TEAL} 0%, ${INK} 100%)` }}
              >
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage: `radial-gradient(circle at 25% 20%, ${COPPER}99, transparent 45%), radial-gradient(circle at 80% 75%, ${SAND}66, transparent 50%)`,
                  }}
                  aria-hidden="true"
                />
                <div className="absolute inset-0 flex items-end p-7">
                  <div className="flex items-end gap-2">
                    {[0.55, 0.85, 0.4, 0.7].map((h, i) => (
                      <div
                        key={i}
                        className="w-5 sm:w-6 rounded-sm"
                        style={{
                          height: `${h * 100}px`,
                          backgroundColor: [SAND, WHITE, COPPER, SAND][i % 4],
                          opacity: 0.9,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <p
                  className="absolute top-7 end-7 text-xs tracking-[0.15em]"
                  style={{ color: `${WHITE}CC`, writingMode: "vertical-rl" }}
                >
                  Better Every Day
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
            const meta = KIND_SECTION[kind] || { title: kind };
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
              {firstName}'s World
            </p>
            <p className="text-sm mt-1" style={{ color: `${WHITE}99` }}>
              A personal space for interests, ideas, and everyday life.
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
                  {NAV_LABELS[key]}
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
function BookCover({ book }) {
  const tone = SPINE_TONES[hashTitle(book.title) % SPINE_TONES.length];
  return (
    <div>
      <div
        className="aspect-[2/3] rounded-md shadow-[0_6px_16px_-6px_rgba(24,32,29,0.25)] flex items-end p-3"
        style={{ backgroundColor: tone }}
      >
        <span className="font-display text-[13px] leading-tight" style={{ color: WHITE }}>
          {book.title}
        </span>
      </div>
      <p className="mt-2 text-xs truncate" style={{ color: MUTED }}>
        {book.subtitle || ""}
      </p>
    </div>
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
