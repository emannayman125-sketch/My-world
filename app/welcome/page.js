import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabaseServer";
import EnterWorldButton from "@/components/EnterWorldButton";

// This screen is always English, left-to-right, regardless of the
// site's language setting — it's a fixed personal letter, shown once.
export default async function WelcomePage() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("has_seen_welcome, display_name")
    .eq("id", user.id)
    .single();

  if (profile?.has_seen_welcome) redirect("/dashboard");

  const name = profile?.display_name || "friend";

  return (
    <main
      dir="ltr"
      lang="en"
      className="min-h-screen flex items-center justify-center px-6 py-16 bg-paper dark:bg-night aurora-bg"
    >
      <div className="relative w-full max-w-xl animate-fade-up">
        {/* Envelope-style card */}
        <div className="card rounded-full_card px-8 py-10 sm:px-14 sm:py-14 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-lantern/15 text-2xl mb-6">
            💌
          </span>

          <p className="font-letter text-2xl sm:text-3xl italic text-ink-muted dark:text-moon-muted mb-8">
            Hey {name},
          </p>

          {/*
            ───────────────────────────────────────────────────────
            PLACEHOLDER — drop the real letter text in here, exactly
            as written. Each <p> below is one paragraph; keep the
            font-letter styling so it reads like a handwritten note.
            ───────────────────────────────────────────────────────
          */}
          <div className="space-y-5 text-start sm:text-center font-letter text-lg sm:text-xl leading-9 text-ink dark:text-moon">
            <p>I built you this little place.</p>
            <p>
              Not because you need to be more productive —
              <br className="hidden sm:block" />
              but because I wanted you to have somewhere that feels like you.
            </p>
            <p>
              A place for the things you love,
              <br className="hidden sm:block" />
              the things you're working on,
              <br className="hidden sm:block" />
              the things you're waiting for,
              <br className="hidden sm:block" />
              and every small detail that makes you, you.
            </p>
            <p>And every time you come here, I hope you find something that makes your day a little nicer.</p>
          </div>

          <p className="font-letter text-2xl sm:text-3xl italic mt-10 mb-1">
            Welcome to your world.
          </p>
          <p className="text-sm text-ink-muted dark:text-moon-muted mb-10">
            Take your time. Explore. 🤍
          </p>

          <EnterWorldButton userId={user.id} />

          <p className="font-letter italic text-sm text-ink-muted dark:text-moon-muted mt-8">
            — Eman
          </p>
        </div>
      </div>
    </main>
  );
}
