import { LIBRARY, CATEGORY_LABELS } from "./library";

// Small deterministic hash so the same day always produces the same
// pick for a given seed — this is a "quote of the day", not a dice
// roll on every refresh.
function seededIndex(seedStr, mod) {
  if (mod <= 0) return 0;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}

const ROUGH_MOODS = ["rough", "tired"];
const BRIGHT_MOODS = ["energized", "good"];

import { todayISO, cairoNow } from "@/lib/time";

/**
 * Pick today's quote.
 * @param {Object} opts
 * @param {string[]} [opts.personalQuotes] - Ahmed's own saved thoughts (notes.kind === 'quote')
 * @param {string} [opts.mood] - today's mood key from daily_moods, if any
 * @param {boolean} [opts.isBirthday]
 * @param {number} [opts.hour] - override for testing; defaults to current hour
 */
export function pickQuote({ personalQuotes = [], mood, isBirthday = false, hour } = {}) {
  const now = new Date();
  const dayKey = todayISO(now);
  const effectiveHour = hour ?? cairoNow(now).hour;

  // Personal thoughts get real priority, not total replacement — they
  // show up roughly 2 days out of 5 whenever Ahmed has written any.
  if (personalQuotes.length > 0 && seededIndex(dayKey + "personal", 5) < 2) {
    const idx = seededIndex(dayKey + "personal-pick", personalQuotes.length);
    return {
      text: personalQuotes[idx],
      author: null,
      lang: null,
      isPersonal: true,
      category: "AHMED'S THOUGHT",
      translation: false,
    };
  }

  let theme;
  if (isBirthday) {
    theme = "birthday";
  } else if (mood && ROUGH_MOODS.includes(mood)) {
    theme = "patience";
  } else if (mood && BRIGHT_MOODS.includes(mood)) {
    theme = seededIndex(dayKey + "bright", 2) === 0 ? "building" : "courage";
  } else if (effectiveHour < 10) {
    theme = "morning";
  } else if (effectiveHour >= 20) {
    theme = "eveningQuiet";
  } else {
    const rotation = ["wisdom", "quiet", "building", "courage", "knowledge"];
    theme = rotation[seededIndex(dayKey + "rotation", rotation.length)];
  }

  const pool = LIBRARY.filter((q) =>
    Array.isArray(q.theme) ? q.theme.includes(theme) : q.theme === theme
  );
  const finalPool = pool.length > 0 ? pool : LIBRARY;
  const chosen = finalPool[seededIndex(dayKey + theme, finalPool.length)];

  return {
    ...chosen,
    isPersonal: false,
    category: CATEGORY_LABELS[theme] || CATEGORY_LABELS.wisdom,
  };
}
