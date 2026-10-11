import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import FadeIn from "@/components/FadeIn";

// ============================================================
// The public profile — a curated personal page, deliberately NOT
// styled like the private dashboard. Same data, same RLS-protected
// queries as before (every table filtered .eq("is_public", true)) —
// this file changes presentation only, not what is fetched or shown.
// Palette is scoped to this one route via arbitrary Tailwind values,
// so it never touches the app's own design tokens.
//
// Typography note: an earlier version forced the hero into exactly
// three lines with hard <br/> breaks at a tight leading-[1.15]. On a
// narrow phone screen the third line still wrapped on top of that
// tight spacing, which is what reads as "lines running into each
// other". Fixed by letting the heading wrap naturally (no forced
// breaks) with a generous leading and a capped width, which is the
// correct way to handle Arabic headings of unpredictable length.
// ============================================================

const INK = "text-[#18201D]";
const SUBTLE = "text-[#68736E]";
const BORDER = "border-[#D8CCBC]";
const TEAL = "text-[#3F706A]";
const COPPER = "text-[#A9694D]";

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
  music: { title: "بسمعه كمان", subtitle: "" },
  movie: { title: "بتفرج عليه", subtitle: "" },
  place: { title: "أماكن في بالي", subtitle: "" },
  hobby: { title: "بيوقّت فيه", subtitle: "" },
};

// The four pillar sections from the brief always get a header, with a
// quiet placeholder line when empty — the rest (music/movies/places/
// hobbies) only appear once there's something real to show.
const EMPTY_NOTES = {
  book: "الرف لسه بيتكوّن.",
  podcast: "لسه مفيش حلقات اتسجّلت هنا.",
  interests: "حاجات تستاهل المعرفة هتكون هنا قريب.",
  social: "لسه ما حدّدش فين يتلاقى.",
};

// Minimal anchor nav, per-section — only sections that actually have
// something to show get a link, so it never points at an empty area.
const NAV_LABELS = {
  currently: "حاليًا",
  books: "القراءة",
  podcasts: "الاستماع",
  interests: "الاهتمامات",
  about: "نبذة",
  social: "روابط",
};

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
  if (!profile) return { title: "الصفحة دي مش موجودة" };
  const name = profile.display_name || "صديقي";
  const description = profile.bio ? profile.bio.slice(0, 150) : `عالم ${name} الشخصي`;
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
  // no schema change needed). Group by that so "From the shelf" reads as
  // an organized shelf instead of one flat list once there are a dozen+.
  const booksByCategory = new Map();
  for (const b of worldByKind.book || []) {
    const cat = (b.notes || "").trim() || "كتب";
    if (!booksByCategory.has(cat)) booksByCategory.set(cat, []);
    booksByCategory.get(cat).push(b);
  }

  const hasSocial = profile.social_links && Object.values(profile.social_links).some(Boolean);
  const firstName = (profile.display_name || "").trim().split(/\s+/)[0] || "صديقي";

  const DEFAULT_ORDER = ["currently", "books", "podcasts", "interests", "about", "social"];
  // Defensive: drop unknown keys from a stale order, then append any
  // default section missing from it (e.g. a new section added later).
  const configured = (profile.public_section_order || []).filter((k) => DEFAULT_ORDER.includes(k));
  const order = [...configured, ...DEFAULT_ORDER.filter((k) => !configured.includes(k))];

  const otherKinds = Object.entries(worldByKind).filter(([kind]) => kind !== "book" && kind !== "podcast");

  // Which of the orderable sections actually render something — used for
  // both the nav bar (only link to non-empty sections) and the sections
  // themselves below.
  const hasContent = {
    currently: currently && currently.length > 0,
    books: (worldByKind.book?.length || 0) > 0,
    podcasts: (worldByKind.podcast?.length || 0) > 0,
    interests: interests && interests.length > 0,
    about: !!profile.bio,
    social: hasSocial,
  };
  const navItems = order.filter((k) => hasContent[k]);

  // Each pillar section as a render function, so they can be reordered —
  // the hero and the "other kinds" block stay fixed, everything else here
  // follows the order Ahmed set in /privacy.
  const sections = {
    currently: hasContent.currently ? (
      <section id="currently" className={`border-t ${BORDER} pt-10 sm:pt-14 space-y-5 scroll-mt-20`}>
        <p className={`text-xs tracking-[0.2em] uppercase ${SUBTLE}`}>حاليًا</p>
        <div className="space-y-5">
          {currently.map((c) => (
            <div key={c.id}>
              <p className={`text-xs mb-1 ${TEAL}`}>
                {c.kind === "listening" && "بيسمع"}
                {c.kind === "watching" && "بيتفرج على"}
                {c.kind === "reading" && "بيقرأ"}
              </p>
              <p className="font-display text-xl sm:text-2xl leading-[1.5]">{c.title}</p>
            </div>
          ))}
        </div>
      </section>
    ) : null,

    books: (
      <section id="books" className={`border-t ${BORDER} pt-10 sm:pt-14 space-y-8 scroll-mt-20`}>
        <div>
          <h2 className="font-display text-2xl sm:text-3xl leading-[1.4]">من على الرف</h2>
          <p className={`text-sm ${SUBTLE} mt-1.5`}>كتب تستاهل تتحفظ.</p>
        </div>
        {booksByCategory.size > 0 ? (
          <div className="space-y-8">
            {[...booksByCategory.entries()].map(([category, books]) => (
              <div key={category}>
                <p className={`text-xs tracking-[0.15em] uppercase mb-3 ${COPPER}`}>{category}</p>
                <ul className="space-y-3.5">
                  {books.map((w) => (
                    <li key={w.id} className="flex items-baseline justify-between gap-4 leading-[1.6]">
                      <span>{w.title}</span>
                      {w.subtitle && <span className={`text-sm ${SUBTLE} shrink-0`} dir="auto">{w.subtitle}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm italic ${SUBTLE}`}>{EMPTY_NOTES.book}</p>
        )}
      </section>
    ),

    podcasts: (
      <section id="podcasts" className={`border-t ${BORDER} pt-10 sm:pt-14 space-y-5 scroll-mt-20`}>
        <h2 className="font-display text-2xl sm:text-3xl leading-[1.4]">بسمعه</h2>
        {worldByKind.podcast?.length > 0 ? (
          <ul className="space-y-3.5">
            {worldByKind.podcast.map((w) => {
              const href = w.link_url && /^https?:\/\//.test(w.link_url) ? w.link_url : null;
              const Wrapper = href ? "a" : "div";
              return (
                <li key={w.id} className="leading-[1.6]">
                  <Wrapper
                    {...(href ? { href, target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
                    className={`flex items-baseline justify-between gap-4 ${href ? `hover:${COPPER} transition` : ""}`}
                  >
                    <span>{w.title}</span>
                    {w.subtitle && <span className={`text-sm ${SUBTLE} shrink-0`} dir="auto">{w.subtitle}</span>}
                  </Wrapper>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={`text-sm italic ${SUBTLE}`}>{EMPTY_NOTES.podcast}</p>
        )}
      </section>
    ),

    interests: (
      <section id="interests" className={`border-t ${BORDER} pt-10 sm:pt-14 space-y-5 scroll-mt-20`}>
        <h2 className="font-display text-2xl sm:text-3xl leading-[1.4]">حاجات بحبها</h2>
        {(!interests || interests.length === 0) && (
          <p className={`text-sm italic ${SUBTLE}`}>{EMPTY_NOTES.interests}</p>
        )}
        {interests && interests.length > 0 && (
          <p className="leading-[2.1] text-lg">{interests.map((i) => i.value).join("  ·  ")}</p>
        )}
      </section>
    ),

    about: hasContent.about ? (
      <section id="about" className={`border-t ${BORDER} pt-10 sm:pt-14 scroll-mt-20`}>
        <p className="font-letter text-xl sm:text-2xl leading-[1.8] whitespace-pre-wrap">{profile.bio}</p>
      </section>
    ) : null,

    social: (
      <section id="social" className={`border-t ${BORDER} pt-10 sm:pt-14 space-y-5 scroll-mt-20`}>
        <h2 className="font-display text-2xl sm:text-3xl leading-[1.4]">تلاقيني كمان في</h2>
        {hasSocial ? (
          <div className="flex flex-wrap gap-x-6 gap-y-3">
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
                  className={`text-sm ${COPPER} hover:underline underline-offset-4`}
                >
                  {label || value}
                </a>
              );
            })}
          </div>
        ) : (
          <p className={`text-sm italic ${SUBTLE}`}>{EMPTY_NOTES.social}</p>
        )}
      </section>
    ),
  };

  return (
    <main className={`min-h-screen bg-[#F4F0E7] ${INK}`} style={{ fontFamily: "var(--font-body), sans-serif" }}>
      {navItems.length > 1 && (
        <nav className={`sticky top-0 z-10 bg-[#F4F0E7]/90 backdrop-blur-sm border-b ${BORDER}`}>
          <div className="max-w-2xl mx-auto px-6 flex items-center gap-5 overflow-x-auto text-xs py-3.5 whitespace-nowrap">
            {navItems.map((key) => (
              <a key={key} href={`#${key}`} className={`${SUBTLE} hover:${TEAL} transition shrink-0`}>
                {NAV_LABELS[key]}
              </a>
            ))}
          </div>
        </nav>
      )}

      <div className="max-w-2xl mx-auto px-6 py-16 sm:py-24 space-y-16 sm:space-y-20">
        {/* Hero — always first, not part of the configurable order. No forced
            line breaks: the heading wraps naturally at whatever width/length
            it needs, with a generous leading so Arabic ascenders/descenders
            never crowd the line above or below. */}
        <FadeIn>
          <header className="space-y-6">
            {profile.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <h1 className="font-display text-[2.1rem] sm:text-5xl leading-[1.5] sm:leading-[1.45] max-w-[14ch]">
              اللي بيقراه، اللي بيسمعه، <span className={TEAL}>واللي بيتكوّن منه.</span>
            </h1>
            <p className={`text-sm ${SUBTLE} leading-[1.9]`}>مجموعة صغيرة من الحاجات اللي بتكوّن عالم {firstName}.</p>
          </header>
        </FadeIn>

        {order.map((key, i) =>
          sections[key] ? (
            <FadeIn key={key} delay={0.05 + i * 0.04}>
              {sections[key]}
            </FadeIn>
          ) : null
        )}

        {/* Any remaining world_items kinds (music/movies/places/hobbies) — fixed
            position, not part of the configurable order, only shown when non-empty */}
        {otherKinds.map(([kind, items], idx) => {
          const meta = KIND_SECTION[kind] || { title: kind, subtitle: "" };
          return (
            <FadeIn key={kind} delay={0.3 + idx * 0.04}>
              <section className={`border-t ${BORDER} pt-10 sm:pt-14 space-y-5`}>
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl leading-[1.4]">{meta.title}</h2>
                  {meta.subtitle && <p className={`text-sm ${SUBTLE} mt-1.5`}>{meta.subtitle}</p>}
                </div>
                <ul className="space-y-3.5">
                  {items.map((w) => (
                    <li key={w.id} className="flex items-baseline justify-between gap-4 leading-[1.6]">
                      <span>{w.title}</span>
                      {w.subtitle && <span className={`text-sm ${SUBTLE} shrink-0`} dir="auto">{w.subtitle}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            </FadeIn>
          );
        })}

        <FadeIn delay={0.5}>
          <p className={`text-center text-xs ${SUBTLE} pt-6`}>{firstName} — {new Date().getFullYear()}</p>
        </FadeIn>
      </div>
    </main>
  );
}
