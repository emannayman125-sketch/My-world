"use client";

import { useState } from "react";

// Client-only piece of the public page: the filter pills above the book
// grid. Everything else on /u/[username] can stay a plain server
// component, but switching categories needs a bit of client state, so
// it's split out here rather than making the whole page client-side.
export default function BookShelf({ categories, emptyNote }) {
  const [active, setActive] = useState("All");

  const visible = categories.filter(([cat]) => active === "All" || active === cat);

  if (categories.length === 0) {
    return <p className="text-sm italic text-[#68736E]">{emptyNote}</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-1 overflow-x-auto pb-1 mb-6 text-sm">
        <button
          type="button"
          onClick={() => setActive("All")}
          className={`shrink-0 px-3 py-1.5 rounded-full transition ${
            active === "All" ? "bg-[#18201D] text-[#FCFBF7]" : "text-[#68736E] hover:text-[#18201D]"
          }`}
        >
          All
        </button>
        {categories.map(([cat]) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActive(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-full transition whitespace-nowrap ${
              active === cat ? "bg-[#18201D] text-[#FCFBF7]" : "text-[#68736E] hover:text-[#18201D]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-5 gap-y-8">
        {visible.flatMap(([cat, books]) => books.map((b) => <BookCover key={b.id} book={b} />))}
      </div>
    </div>
  );
}

const SPINE_TONES = ["#3F706A", "#A9694D", "#18201D", "#68736E"];

function BookCover({ book }) {
  const tone = SPINE_TONES[hash(book.title) % SPINE_TONES.length];
  return (
    <div className="group">
      <div
        className="aspect-[2/3] rounded-md shadow-[0_6px_16px_-6px_rgba(24,32,29,0.25)] flex items-end p-3 transition-transform group-hover:-translate-y-1"
        style={{ backgroundColor: tone }}
      >
        <span className="font-display text-[13px] leading-tight text-[#FCFBF7]">{book.title}</span>
      </div>
      <p className="mt-2 text-xs text-[#68736E] truncate">{book.subtitle || ""}</p>
    </div>
  );
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
