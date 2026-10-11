"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabaseClient";
import { useConfirm } from "./ConfirmProvider";
import EmptyState from "./EmptyState";
import { Plus, Trash2, BookOpen, LibraryBig } from "lucide-react";

const CATEGORY_ORDER = [
  "currently_reading",
  "want_to_read",
  "mba",
  "research",
  "business",
  "personal_development",
  "finished",
];

export default function LibraryManager({ userId, initialBooks, strings }) {
  const supabase = createClient();
  const { confirm } = useConfirm();
  const l = strings.library;

  const [books, setBooks] = useState(initialBooks || []);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", category: "want_to_read" });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function addBook(e) {
    e.preventDefault();
    if (!form.title.trim() || !file) return;
    setUploading(true);
    setError("");

    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${userId}/${Date.now()}_${safeName}`;

    const { error: uploadError } = await supabase.storage.from("library").upload(path, file);
    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("library_books")
      .insert({
        user_id: userId,
        title: form.title.trim(),
        author: form.author.trim() || null,
        category: form.category,
        file_path: path,
      })
      .select()
      .single();

    setUploading(false);
    if (!insertError && data) {
      setBooks((list) => [data, ...list]);
      setForm({ title: "", author: "", category: "want_to_read" });
      setFile(null);
      setOpen(false);
    } else if (insertError) {
      setError(insertError.message);
    }
  }

  async function removeBook(book) {
    if (!(await confirm(l.confirmDelete))) return;
    // Delete the DB row first: if that fails we bail out with nothing lost.
    // Doing it the other way around (file first) could orphan a DB row
    // pointing at a file that's already gone.
    const { error: deleteError } = await supabase.from("library_books").delete().eq("id", book.id);
    if (deleteError) { setError(deleteError.message); return; }
    if (book.file_path) {
      await supabase.storage.from("library").remove([book.file_path]);
    }
    setBooks((list) => list.filter((b) => b.id !== book.id));
  }

  const grouped = CATEGORY_ORDER.map((key) => ({
    key,
    label: l.categories[key],
    items: books.filter((b) => b.category === key),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full card card-hover p-4 flex items-center justify-center gap-2 text-sm
                     text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon transition"
        >
          <Plus size={15} strokeWidth={2} />
          {l.addBook}
        </button>
      ) : (
        <form onSubmit={addBook} className="card p-4 space-y-2">
          <input
            autoFocus
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder={l.bookTitle}
            className="w-full rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                       px-3 py-2 text-sm outline-none focus:border-sage"
          />
          <div className="flex gap-2 flex-wrap">
            <input
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              placeholder={l.author}
              className="flex-1 min-w-[140px] rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                         px-3 py-2 text-sm outline-none focus:border-sage"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="rounded-soft border border-black/10 dark:border-white/10 bg-transparent
                         px-3 py-2 text-sm outline-none focus:border-sage"
            >
              {CATEGORY_ORDER.map((key) => (
                <option key={key} value={key}>{l.categories[key]}</option>
              ))}
            </select>
          </div>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={uploading || !form.title.trim() || !file}
              className="rounded-soft bg-lantern text-night text-sm font-medium px-4 py-2
                         hover:brightness-105 transition disabled:opacity-50"
            >
              {uploading ? l.uploading : l.save}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-ink-muted dark:text-moon-muted hover:text-ink dark:hover:text-moon"
            >
              {strings.quote.cancel}
            </button>
          </div>
        </form>
      )}

      {books.length === 0 && !open && (
        <EmptyState icon={LibraryBig} title={l.noBooks} hint={l.subtitle} actionLabel={l.addBook} onAction={() => setOpen(true)} />
      )}

      {grouped.map((group) => (
        <div key={group.key}>
          <h2 className="text-xs tracking-[0.1em] text-ink-muted/70 dark:text-moon-muted/70 mb-2">
            {group.label.toUpperCase()}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {group.items.map((b) => (
              <div key={b.id} className="card card-hover p-4 flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sage/15 text-sage dark:text-sage-soft shrink-0">
                  <BookOpen size={17} strokeWidth={2} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{b.title}</p>
                  {b.author && <p className="text-xs text-ink-muted dark:text-moon-muted">{b.author}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <Link href={`/library/${b.id}`} className="text-xs text-sage dark:text-sage-soft underline">
                      {l.read}
                    </Link>
                    <button
                      onClick={() => removeBook(b)}
                      aria-label={l.delete}
                      className="text-ink-muted/60 hover:text-red-500 transition"
                    >
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
