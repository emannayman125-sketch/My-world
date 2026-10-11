import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import FadeIn from "@/components/FadeIn";

// ============================================================
// The public profile — dark, warm-glow, "premium dashboard" look
// (reference: dark charcoal background, one amber glow accent, rounded
// card modules, sticky pill nav). Reuses the app's own "Lantern Night"
// dark palette (night/lantern tokens already defined in
// tailwind.config.js) rather than inventing a new one — same accent
// color the rest of the app already uses, so this page still feels
// part of the same product instead of a bolt-on theme.
//
// Copy is English (per her request — the earlier Arabic wording read
// as clumsy/informal for something meant to look premium and be
// shared with colleagues/friends). dir="ltr" is set explicitly below
// since this page no longer follows the app's own RTL default.
//
// Same data, same RLS-protected queries as before (every table
// filtered .eq("is_public", true)) — this file changes presentation
// only, not what is fetched or shown.
// ============================================================

const BORDER = "border-white/[0.06]";
const MUTED = "text-moon-muted";

const SOCIAL_LABELS = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  youtube: "YouTube",
  tiktok: "TikTok",
  x: "X",
  website: "",
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
  podcast: "Nothing queued up here yet.",
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
  reading: "Reading",
  listening: "Listening to",
  watching: "Watching",
};

// One card shell used everywhere (books, podcasts, interests, about,
// social, currently) so the whole page reads as one consistent system
// of modules -- exactly the "card grid" language of the reference.
function Card({ id, title, subtitle, children, className = "" }) {
  return (
    <section id={id} className={`scroll-mt-24 rounded-3xl bg-night-card/80 border ${BORDER} p-6 sm:p-8 ${className}`}>
      {title && (
        <div className="mb-5">
          <h2 className="font-display text-xl sm:text-2xl leading-[1.4] text-moon">{title}</h2>
          {subtitle && <p className={`text-sm ${MUTED} mt-1`}>{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
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
  const description = profile.bio ? profile.bio.slice(0, 150) : `${name}'s personal space.`;
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

  // Books carry their category in `notes` (reusing the existing column —
  // no schema change needed), grouped here into a shelf-by-shelf layout.
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

  // Small glanceable stat row under the hero — real counts only, no
  // invented metrics, but it gives the page the same "at a glance"
  // feeling as the reference's stat-tile row.
  const stats = [
    { label: worldByKind.book?.length === 1 ? "book" : "books", value: worldByKind.book?.length || 0 },
    { label: "episodes", value: worldByKind.podcast?.length || 0 },
    { label: interests?.length === 1 ? "interest" : "interests", value: interests?.length || 0 },
  ].filter((s) => s.value > 0);

  const sections = {
    currently: hasContent.currently ? (
      <Card id="currently" title="Currently">
        <div className="grid sm:grid-cols-2 gap-4">
          {currently.map((c) => (
            <div key={c.id} className={`rounded-2xl bg-white/[0.03] border ${BORDER} p-4`}>
              <p className="text-xs text-lantern-soft mb-1.5">{CURRENTLY_LABELS[c.kind] || c.kind}</p>
              <p className="font-display text-lg leading-[1.5] text-moon">{c.title}</p>
            </div>
          ))}
        </div>
      </Card>
    ) : null,

    books: (
      <Card id="books" title="From the Shelf" subtitle="A few books worth keeping.">
        {booksByCategory.size > 0 ? (
          <div className="space-y-6">
            {[...booksByCategory.entries()].map(([category, books]) => (
              <div key={category}>
                <span className="inline-block text-xs text-lantern-ink bg-lantern-soft/90 rounded-full px-3 py-1 mb-3">
                  {category}
                </span>
                <ul className="grid sm:grid-cols-2 gap-2.5">
                  {books.map((w) => (
                    <li
                      key={w.id}
                      className={`rounded-xl bg-white/[0.03] border ${BORDER} px-4 py-3 flex items-baseline justify-between gap-3`}
                    >
                      <span className="text-moon leading-[1.5]">{w.title}</span>
                      {w.subtitle && <span className={`text-xs ${MUTED} shrink-0`}>{w.subtitle}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm italic ${MUTED}`}>{EMPTY_NOTES.book}</p>
        )}
      </Card>
    ),

    podcasts: (
      <Card id="podcasts" title="What I'm Listening To">
        {worldByKind.podcast?.length > 0 ? (
          <ul className="grid sm:grid-cols-2 gap-2.5">
            {worldByKind.podcast.map((w) => {
              const href = w.link_url && /^https?:\/\//.test(w.link_url) ? w.link_url : null;
              const Wrapper = href ? "a" : "div";
              return (
                <li key={w.id}>
                  <Wrapper
                    {...(href ? { href, target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
                    className={`rounded-xl bg-white/[0.03] border ${BORDER} px-4 py-3 flex items-baseline justify-between gap-3 ${
                      href ? "hover:border-lantern-soft/40 transition" : ""
                    }`}
                  >
                    <span className="text-moon leading-[1.5]">{w.title}</span>
                    {w.subtitle && <span className={`text-xs ${MUTED} shrink-0`}>{w.subtitle}</span>}
                  </Wrapper>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={`text-sm italic ${MUTED}`}>{EMPTY_NOTES.podcast}</p>
        )}
      </Card>
    ),

    interests: (
      <Card id="interests" title="A Few Things I Love">
        {(!interests || interests.length === 0) && <p className={`text-sm italic ${MUTED}`}>{EMPTY_NOTES.interests}</p>}
        {interests && interests.length > 0 && (
          <div className="flex flex-wrap gap-2.5">
            {interests.map((i) => (
              <span key={i.id} className={`rounded-full bg-white/[0.04] border ${BORDER} text-moon text-sm px-4 py-2`}>
                {i.value}
              </span>
            ))}
          </div>
        )}
      </Card>
    ),

    about: hasContent.about ? (
      <Card id="about" title="About">
        <p className="font-letter text-lg sm:text-xl leading-[1.9] text-moon whitespace-pre-wrap">{profile.bio}</p>
      </Card>
    ) : null,

    social: (
      <Card id="social" title="Find Me Elsewhere">
        {hasSocial ? (
          <div className="flex flex-wrap gap-3">
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
                  className={`rounded-full bg-white/[0.04] border ${BORDER} hover:border-lantern-soft/40 hover:text-lantern-soft transition text-moon text-sm px-4 py-2`}
                >
                  {label || value}
                </a>
              );
            })}
          </div>
        ) : (
          <p className={`text-sm italic ${MUTED}`}>{EMPTY_NOTES.social}</p>
        )}
      </Card>
    ),
  };

  return (
    <main dir="ltr" lang="en" className="min-h-screen bg-night" style={{ fontFamily: "var(--font-body), sans-serif" }}>
      {navItems.length > 1 && (
        <nav className="sticky top-0 z-10 bg-night/85 backdrop-blur-md border-b border-white/[0.06]">
          <div className="max-w-3xl mx-auto px-6 flex items-center gap-2 overflow-x-auto py-3.5 whitespace-nowrap">
            {navItems.map((key) => (
              <a
                key={key}
                href={`#${key}`}
                className={`shrink-0 text-xs rounded-full px-3.5 py-1.5 ${MUTED} hover:text-moon hover:bg-white/[0.06] transition`}
              >
                {NAV_LABELS[key]}
              </a>
            ))}
          </div>
        </nav>
      )}

      <div className="max-w-3xl mx-auto px-6 py-14 sm:py-20 space-y-6">
        {/* Hero — a glowing dark card like the reference's headline tile,
            with a soft blurred amber glow behind it rather than a flat
            background. No forced <br/> line breaks: the heading wraps
            naturally with generous leading. */}
        <FadeIn>
          <header className="relative rounded-3xl bg-night-card/80 border border-white/[0.06] p-8 sm:p-12 overflow-hidden">
            <div
              className="pointer-events-none absolute -top-24 -start-24 w-72 h-72 rounded-full bg-lantern/25 blur-[90px]"
              aria-hidden="true"
            />
            <div className="relative space-y-5">
              {profile.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white/10"
                />
              )}
              <h1 className="font-display text-[2rem] sm:text-5xl leading-[1.3] sm:leading-[1.25] max-w-[14ch] text-moon">
                What I read. What I listen to. <span className="text-lantern-soft">What I'm becoming.</span>
              </h1>
              <p className={`text-sm ${MUTED} leading-[1.9]`}>A small collection of the things that shape my world.</p>

              {stats.length > 0 && (
                <div className="flex flex-wrap gap-3 pt-2">
                  {stats.map((s) => (
                    <div key={s.label} className={`rounded-2xl bg-white/[0.04] border ${BORDER} px-4 py-2.5`}>
                      <span className="font-display text-xl text-lantern-soft">{s.value}</span>{" "}
                      <span className={`text-xs ${MUTED}`}>{s.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </header>
        </FadeIn>

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
              <Card title={meta.title}>
                <ul className="grid sm:grid-cols-2 gap-2.5">
                  {items.map((w) => (
                    <li
                      key={w.id}
                      className={`rounded-xl bg-white/[0.03] border ${BORDER} px-4 py-3 flex items-baseline justify-between gap-3`}
                    >
                      <span className="text-moon leading-[1.5]">{w.title}</span>
                      {w.subtitle && <span className={`text-xs ${MUTED} shrink-0`}>{w.subtitle}</span>}
                    </li>
                  ))}
                </ul>
              </Card>
            </FadeIn>
          );
        })}

        <FadeIn delay={0.5}>
          <p className={`text-center text-xs ${MUTED} pt-6`}>{firstName} — {new Date().getFullYear()}</p>
        </FadeIn>
      </div>
    </main>
  );
}
