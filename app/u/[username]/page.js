import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import FadeIn from "@/components/FadeIn";

const SOCIAL_LABELS = {
  instagram: { emoji: "📷", label: "Instagram" },
  youtube: { emoji: "▶️", label: "YouTube" },
  tiktok: { emoji: "🎵", label: "TikTok" },
  x: { emoji: "✖️", label: "X" },
  website: { emoji: "🔗", label: "" },
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

const WORLD_KIND_LABELS = {
  music: { emoji: "🎵", label: "موسيقى" },
  movie: { emoji: "🎬", label: "أفلام ومسلسلات" },
  podcast: { emoji: "🎙️", label: "بودكاست" },
  book: { emoji: "📚", label: "كتب" },
  place: { emoji: "✈️", label: "أماكن" },
  hobby: { emoji: "🎮", label: "هوايات" },
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
  const description = profile.bio ? profile.bio.slice(0, 150) : `عالم ${name} الشخصي 🌍`;

  return {
    title: `${name} — عالمه الشخصي`,
    description,
    openGraph: {
      title: `${name} — عالمه الشخصي`,
      description,
      images: profile.avatar_url ? [{ url: profile.avatar_url }] : [],
    },
    twitter: {
      card: "summary",
      title: `${name} — عالمه الشخصي`,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  };
}

export default async function PublicProfilePage({ params }) {
  const supabase = createServerSupabase();
  const profile = await getProfile(params.username);
  if (!profile) notFound();

  const [{ data: interests }, { data: currently }, { data: world }] = await Promise.all([
    supabase.from("interests").select("*").eq("user_id", profile.id).eq("is_public", true),
    supabase.from("currently_items").select("*").eq("user_id", profile.id).eq("is_public", true),
    supabase.from("world_items").select("*").eq("user_id", profile.id).eq("is_public", true),
  ]);

  const worldByKind = {};
  for (const item of world || []) {
    worldByKind[item.kind] = worldByKind[item.kind] || [];
    worldByKind[item.kind].push(item);
  }

  return (
    <main className="min-h-screen bg-paper dark:bg-night px-6 py-12 aurora-bg">
      <div className="max-w-lg mx-auto space-y-6">
        <FadeIn>
          <div className="text-center">
            {profile.avatar_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={profile.display_name}
                className="w-24 h-24 rounded-full object-cover mx-auto mb-4 shadow-glow"
              />
            )}
            <h1 className="font-display text-3xl">{profile.display_name || "صديقي"}</h1>
          </div>
        </FadeIn>

        {profile.social_links && Object.keys(profile.social_links).length > 0 && (
          <FadeIn delay={0.03}>
            <div className="flex flex-wrap justify-center gap-2">
              {Object.entries(profile.social_links).map(([platform, value]) => {
                const href = toHref(platform, value);
                if (!href) return null;
                const meta = SOCIAL_LABELS[platform] || { emoji: "🔗", label: platform };
                return (
                  <a
                    key={platform}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1.5 rounded-full bg-black/5 dark:bg-white/5 px-3 py-1.5 text-sm hover:bg-black/10 dark:hover:bg-white/10 transition"
                  >
                    {meta.emoji} {meta.label}
                  </a>
                );
              })}
            </div>
          </FadeIn>
        )}

        {profile.bio && (
          <FadeIn delay={0.05}>
            <div className="card p-6">
              <p className="leading-8 whitespace-pre-wrap">{profile.bio}</p>
            </div>
          </FadeIn>
        )}

        {currently && currently.length > 0 && (
          <FadeIn delay={0.1}>
            <div className="card p-6">
              <h2 className="font-display text-lg mb-3">🎧 حاليًا</h2>
              <ul className="space-y-1 text-sm">
                {currently.map((c) => (
                  <li key={c.id}>
                    {c.kind === "listening" && "🎧 بيسمع: "}
                    {c.kind === "watching" && "🎬 بيتفرج على: "}
                    {c.kind === "reading" && "📚 بيقرأ: "}
                    {c.title}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        )}

        {interests && interests.length > 0 && (
          <FadeIn delay={0.15}>
            <div className="card p-6">
              <h2 className="font-display text-lg mb-3">❤️ اهتمامات</h2>
              <div className="flex flex-wrap gap-2">
                {interests.map((i) => (
                  <span key={i.id} className="rounded-full bg-black/5 dark:bg-white/5 px-3 py-1 text-sm">
                    {i.value}
                  </span>
                ))}
              </div>
            </div>
          </FadeIn>
        )}

        {Object.entries(worldByKind).map(([kind, items], idx) => (
          <FadeIn key={kind} delay={0.2 + idx * 0.05}>
            <div className="card p-6">
              <h2 className="font-display text-lg mb-3">
                {WORLD_KIND_LABELS[kind]?.emoji} {WORLD_KIND_LABELS[kind]?.label || kind}
              </h2>
              <ul className="space-y-1 text-sm">
                {items.map((w) => (
                  <li key={w.id}>
                    {w.title}
                    {w.subtitle && <span className="text-ink-muted dark:text-moon-muted"> — {w.subtitle}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </FadeIn>
        ))}

        <p className="text-center text-xs text-ink-muted dark:text-moon-muted">
          صُنع بحب على Personal World 🤍
        </p>
      </div>
    </main>
  );
}
