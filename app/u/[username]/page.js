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
// ============================================================

const INK = "text-[#18201D]";
const SUBTLE = "text-[#68736E]";
const BORDER = "border-[#D8CCBC]";
const TEAL = "text-[#3F706A]";
const COPPER = "text-[#A9694D]";

const SOCIAL_LABELS = {
  instagram: "Instagram",
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
    youtube: "https://youtube.com/@",
    tiktok: "https://tiktok.com/@",
    x: "https://x.com/",
    website: "https://",
  };
  return (bases[platform] || "https://") + value.replace(/^@/, "");
}

const KIND_SECTION = {
  book: { title: "من على الرف", subtitle: "كتب تستاهل تتحفظ." },
  podcast: { title: "بسمعه", subtitle: "" },
  music: { title: "بسمعه كمان", subtitle: "" },
  movie: { title: "بتفرج عليه", subtitle: "" },
  place: { title: "أماكن في بالي", subtitle: "" },
  hobby: { title: "بيوقّت فيه", subtitle: "" },
};

async function getProfile(username) {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("public_profiles")
    .select("id, display_name, bio, avatar_url, social_links")
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

  const hasSocial = profile.social_links && Object.values(profile.social_links).some(Boolean);
  const firstName = (profile.display_name || "").trim().split(/\s+/)[0] || "صديقي";

  return (
    <main className={`min-h-screen bg-[#F4F0E7] ${INK}`} style={{ fontFamily: "var(--font-body), sans-serif" }}>
      <div className="max-w-xl mx-auto px-6 py-16 sm:py-24 space-y-20">
        {/* Hero */}
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
            <h1 className="font-display text-4xl sm:text-5xl leading-[1.15]">
              اللي بيقراه.
              <br />
              اللي بيسمعه.
              <br />
              <span className={TEAL}>واللي بيتكوّن منه.</span>
            </h1>
            <p className={`text-sm ${SUBTLE}`}>مجموعة صغيرة من الحاجات اللي بتكوّن عالم {firstName}.</p>

            {hasSocial && (
              <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
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
            )}
          </header>
        </FadeIn>

        {/* Currently — the featured, close-to-hero section */}
        {currently && currently.length > 0 && (
          <FadeIn delay={0.05}>
            <section className={`border-t ${BORDER} pt-10 space-y-5`}>
              <p className={`text-xs tracking-[0.2em] uppercase ${SUBTLE}`}>حاليًا</p>
              <div className="space-y-4">
                {currently.map((c) => (
                  <div key={c.id}>
                    <p className={`text-xs ${TEAL}`}>
                      {c.kind === "listening" && "بيسمع"}
                      {c.kind === "watching" && "بيتفرج على"}
                      {c.kind === "reading" && "بيقرأ"}
                    </p>
                    <p className="font-display text-xl">{c.title}</p>
                  </div>
                ))}
              </div>
            </section>
          </FadeIn>
        )}

        {/* Reading / Listening / etc. — editorial lists, one section per kind */}
        {Object.entries(worldByKind).map(([kind, items], idx) => {
          const meta = KIND_SECTION[kind] || { title: kind, subtitle: "" };
          return (
            <FadeIn key={kind} delay={0.1 + idx * 0.04}>
              <section className={`border-t ${BORDER} pt-10 space-y-5`}>
                <div>
                  <h2 className="font-display text-2xl">{meta.title}</h2>
                  {meta.subtitle && <p className={`text-sm ${SUBTLE} mt-1`}>{meta.subtitle}</p>}
                </div>
                <ul className="space-y-4">
                  {items.map((w) => (
                    <li key={w.id} className="flex items-baseline justify-between gap-4">
                      <span>{w.title}</span>
                      {w.subtitle && <span className={`text-sm ${SUBTLE} shrink-0`}>{w.subtitle}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            </FadeIn>
          );
        })}

        {/* Interests */}
        {interests && interests.length > 0 && (
          <FadeIn delay={0.3}>
            <section className={`border-t ${BORDER} pt-10 space-y-5`}>
              <h2 className="font-display text-2xl">حاجات بحبها</h2>
              <p className="leading-8">
                {interests.map((i) => i.value).join("  ·  ")}
              </p>
            </section>
          </FadeIn>
        )}

        {/* About */}
        {profile.bio && (
          <FadeIn delay={0.35}>
            <section className={`border-t ${BORDER} pt-10`}>
              <p className="font-letter text-xl leading-9 whitespace-pre-wrap">{profile.bio}</p>
            </section>
          </FadeIn>
        )}

        <FadeIn delay={0.4}>
          <p className={`text-center text-xs ${SUBTLE} pt-6`}>صُنع بحب 🤍</p>
        </FadeIn>
      </div>
    </main>
  );
}
