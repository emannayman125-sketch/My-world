"use client";

export default function ErrorPage({ reset }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-paper dark:bg-night aurora-bg">
      <div className="text-center max-w-sm animate-fade-up">
        <p className="text-6xl mb-4">🌧️</p>
        <h1 className="font-display text-3xl mb-2">حصلت مشكلة بسيطة</h1>
        <p className="text-ink-muted dark:text-moon-muted mb-8">
          مش أنت السبب. جرّب تاني، ولو استمرت المشكلة قوليلنا.
        </p>
        <button
          onClick={reset}
          className="rounded-soft bg-lantern text-night font-medium px-6 py-3 shadow-lantern hover:brightness-105 transition"
        >
          حاول تاني
        </button>
      </div>
    </main>
  );
}
