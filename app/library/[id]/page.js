import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { createServerSupabase } from "@/lib/supabaseServer";
import AppHeader from "@/components/AppHeader";
import BookNotes from "@/components/BookNotes";
import { getLocale } from "@/lib/i18n/getLocale";
import { t } from "@/lib/i18n/dictionaries";

export default async function BookReaderPage({ params }) {
  const locale = getLocale();
  const strings = t(locale);
  const Arrow = locale === "ar" ? ArrowRight : ArrowLeft;

  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: book } = await supabase
    .from("library_books")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!book) notFound();

  let signedUrl = null;
  if (book.file_path) {
    const { data } = await supabase.storage
      .from("library")
      .createSignedUrl(book.file_path, 60 * 60);
    signedUrl = data?.signedUrl || null;
  }

  return (
    <div className="min-h-screen bg-paper dark:bg-night lg:ps-64">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-6 pb-16 space-y-4">
        <Link href="/library" className="inline-flex items-center gap-1.5 text-sm text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon">
          <Arrow size={14} strokeWidth={2} />
          {strings.library.back}
        </Link>

        <div>
          <h1 className="font-display text-2xl">{book.title}</h1>
          {book.author && <p className="text-ink-muted dark:text-moon-muted">{book.author}</p>}
        </div>

        {signedUrl ? (
          <div className="card overflow-hidden" style={{ height: "75vh" }}>
            <iframe src={signedUrl} title={book.title} className="w-full h-full" />
          </div>
        ) : (
          <p className="text-sm text-ink-muted dark:text-moon-muted">
            {locale === "ar" ? "مفيش ملف مرفوع للكتاب ده لسه." : "No file uploaded for this book yet."}
          </p>
        )}

        <BookNotes bookId={book.id} initialNotes={book.notes} strings={strings} />
      </main>
    </div>
  );
}
