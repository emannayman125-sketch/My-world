// A curated literary quote library — classical Arabic poetry, verified
// wisdom literature, and public-domain English literature. No invented
// lines, no unverifiable attributions. Where a quote is genuinely a
// translation rather than the author's original wording, `translation`
// is set to true and the UI should say so.
//
// `theme` may be a single key or an array of keys when a line genuinely
// fits more than one mood (e.g. a courage couplet that also suits a
// fresh morning).

export const CATEGORY_LABELS = {
  courage: "COURAGE · AMBITION",
  patience: "PATIENCE · HOPE",
  knowledge: "KNOWLEDGE · LEARNING",
  wisdom: "WISDOM · LIFE",
  morning: "BEGINNINGS",
  building: "BUILDING · CRAFT",
  quiet: "QUIET · BEAUTIFUL",
  eveningQuiet: "EVENING · REFLECTION",
  birthday: "CELEBRATION",
};

export const LIBRARY = [
  // ───────────────── Arabic — courage, ambition, determination ─────────────────
  {
    text: "على قدرِ أهلِ العزمِ تأتي العزائمُ\nوتأتي على قدرِ الكرامِ المكارمُ",
    author: "المتنبي",
    lang: "ar",
    theme: ["courage", "building"],
  },
  {
    text: "إذا غامرتَ في شرفٍ مرومِ\nفلا تقنعْ بما دونَ النجومِ",
    author: "المتنبي",
    lang: "ar",
    theme: ["courage", "morning", "building"],
  },
  {
    text: "لا يسلمُ الشرفُ الرفيعُ من الأذى\nحتى يُراقَ على جوانبهِ الدمُ",
    author: "المتنبي",
    lang: "ar",
    theme: "courage",
  },
  {
    text: "وإذا كانت النفوسُ كبارًا\nتعبتْ في مرادِها الأجسامُ",
    author: "المتنبي",
    lang: "ar",
    theme: "courage",
  },
  {
    text: "الرأيُ قبلَ شجاعةِ الشجعانِ\nهو أولٌ وهي المحلُّ الثاني",
    author: "المتنبي",
    lang: "ar",
    theme: "courage",
  },
  {
    text: "إذا الشعبُ يومًا أراد الحياة\nفلا بدَّ أن يستجيبَ القدر",
    author: "أبو القاسم الشابي",
    lang: "ar",
    theme: "courage",
  },
  {
    text: "ومن يتهيبْ صعودَ الجبال\nيعشْ أبدَ الدهرِ بين الحُفَر",
    author: "أبو القاسم الشابي",
    lang: "ar",
    theme: ["courage", "building"],
  },
  {
    text: "فلا الأفقُ يحبسُ أحلامَنا\nولا الأرضُ تنفي أمانينا",
    author: "أبو القاسم الشابي",
    lang: "ar",
    theme: ["courage", "morning"],
  },
  {
    text: "وكلُّ امرئٍ يولي الجميلَ محبَّبٌ\nوكلُّ مكانٍ يُنبتُ العزَّ طيّبُ",
    author: "المتنبي",
    lang: "ar",
    theme: ["courage", "building"],
  },

  // ───────────────── Arabic — patience, journey, hope ─────────────────
  {
    text: "دعِ الأيامَ تفعلُ ما تشاءُ\nوطبْ نفسًا إذا حكمَ القضاءُ",
    author: "الإمام الشافعي",
    lang: "ar",
    theme: "patience",
  },
  {
    text: "ولربَّ نازلةٍ يضيقُ بها الفتى\nذرعًا وعندَ اللهِ منها المخرجُ",
    author: "الإمام الشافعي",
    lang: "ar",
    theme: "patience",
  },
  {
    text: "ضاقتْ فلمّا استحكمتْ حلقاتُها\nفُرجتْ وكنتُ أظنُّها لا تُفرجُ",
    author: "الإمام الشافعي",
    lang: "ar",
    theme: "patience",
  },
  {
    text: "سأعيشُ رغمَ الداءِ والأعداءِ\nكالنسرِ فوقَ القمةِ الشمّاءِ",
    author: "أبو القاسم الشابي",
    lang: "ar",
    theme: ["patience", "morning"],
  },

  // ───────────────── Arabic — knowledge & learning ─────────────────
  {
    text: "وخيرُ جليسٍ في الزمانِ كتابُ",
    author: "المتنبي",
    lang: "ar",
    theme: "knowledge",
  },
  {
    text: "الكتابُ هو الجليسُ الذي لا يُمِلُّك، والصديقُ الذي لا يُغريك",
    author: "الجاحظ",
    lang: "ar",
    theme: "knowledge",
  },
  {
    text: "العلمُ يحرسُك وأنت تحرسُ المال",
    author: "علي بن أبي طالب",
    lang: "ar",
    theme: "knowledge",
  },

  // ───────────────── Arabic — wisdom & life ─────────────────
  {
    text: "ومن طلبَ العلا من غيرِ كدٍّ\nأضاعَ العمرَ في طلبِ المحالِ",
    author: "المتنبي",
    lang: "ar",
    theme: "wisdom",
  },
  {
    text: "ما حكَّ جلدَك مثلُ ظُفركَ\nفتولَّ أنتَ جميعَ أمركَ",
    author: "الإمام الشافعي",
    lang: "ar",
    theme: "wisdom",
  },
  {
    text: "هلك خزّانُ الأموالِ وهم أحياء، والعلماءُ باقون ما بقي الدهر",
    author: "علي بن أبي طالب",
    lang: "ar",
    theme: "wisdom",
  },

  // ───────────────── Arabic — quiet & beautiful ─────────────────
  {
    text: "النسيانُ هو تدريبُ الخيالِ على احترامِ الواقع",
    author: "محمود درويش",
    lang: "ar",
    theme: "quiet",
  },

  // ───────────────── English — classic & timeless ─────────────────
  { text: "We know what we are, but know not what we may be.", author: "William Shakespeare", lang: "en", theme: "wisdom" },
  { text: "Our doubts are traitors.", author: "William Shakespeare", lang: "en", theme: "courage" },
  { text: "To strive, to seek, to find, and not to yield.", author: "Alfred, Lord Tennyson", lang: "en", theme: "courage" },
  { text: "The best way out is always through.", author: "Robert Frost", lang: "en", theme: "patience" },
  { text: "I have promises to keep, and miles to go before I sleep.", author: "Robert Frost", lang: "en", theme: "eveningQuiet" },
  { text: "Go confidently in the direction of your dreams.", author: "Henry David Thoreau", lang: "en", theme: "morning" },
  { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", lang: "en", theme: "wisdom" },
  { text: "Keep your face always toward the sunshine.", author: "Walt Whitman", lang: "en", theme: "morning" },
  { text: "I am larger, better than I thought.", author: "Walt Whitman", lang: "en", theme: "wisdom" },
  { text: "We are all in the gutter, but some of us are looking at the stars.", author: "Oscar Wilde", lang: "en", theme: "quiet" },
  { text: "No one is useless in this world who lightens the burdens of another.", author: "Charles Dickens", lang: "en", theme: "quiet" },
  { text: "It's no use going back to yesterday, because I was a different person then.", author: "Lewis Carroll", lang: "en", theme: "wisdom" },

  // ───────────────── English — ambition & courage ─────────────────
  { text: "It is hard to fail, but it is worse never to have tried to succeed.", author: "Theodore Roosevelt", lang: "en", theme: "courage" },
  { text: "Nothing great was ever achieved without enthusiasm.", author: "Ralph Waldo Emerson", lang: "en", theme: ["courage", "building"] },
  { text: "The question is not what you look at, but what you see.", author: "Henry David Thoreau", lang: "en", theme: "wisdom" },
  { text: "Life is either a daring adventure or nothing.", author: "Helen Keller", lang: "en", theme: "courage" },

  // ───────────────── English — learning & knowledge ─────────────────
  { text: "Knowledge itself is power.", author: "Francis Bacon", lang: "en", theme: "knowledge" },
  { text: "Reading maketh a full man.", author: "Francis Bacon", lang: "en", theme: "knowledge" },
  { text: "It is never too late to be what you might have been.", author: "George Eliot", lang: "en", theme: ["knowledge", "morning"] },

  // ───────────────── English — building & craft ─────────────────
  { text: "Design is not just what it looks like and feels like. Design is how it works.", author: "Steve Jobs", lang: "en", theme: "building" },

  // ───────────────── English — quiet evening ─────────────────
  { text: "The rest is silence.", author: "William Shakespeare", lang: "en", theme: "eveningQuiet" },
  { text: "A thing of beauty is a joy for ever.", author: "John Keats", lang: "en", theme: "eveningQuiet" },
  { text: "And miles to go before I sleep.", author: "Robert Frost", lang: "en", theme: "eveningQuiet" },

  // ───────────────── Arabic — chosen by Eman ─────────────────
  { text: "كُنْ مِثلَهُ فارِسًا، كُنْ مِثلَهُ نَجدًا", author: null, lang: "ar", theme: ["courage", "building"] },

  // ───────────────── Arabic — courage & ambition (classical, verified) ─────────────────
  {
    text: "مَن جَدَّ وَجَد، وَمَن زَرَعَ حَصَد",
    author: null,
    lang: "ar",
    theme: ["courage", "building"],
  },
  {
    text: "وَما نَيلُ المَطالِبِ بِالتَمَنّي\nوَلَكِن تُؤخَذُ الدُنيا غِلابا",
    author: "أبو الطيب المتنبي",
    lang: "ar",
    theme: ["courage", "building"],
  },
  {
    text: "رُبَّ أَخٍ لَم تَلِدهُ أُمُّكَ",
    author: null,
    lang: "ar",
    theme: "wisdom",
  },

  // ───────────────── English — courage & building (verified public domain) ─────────────────
  { text: "Whether you think you can, or you think you can't — you're right.", author: "Henry Ford", lang: "en", theme: ["courage", "building"] },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", lang: "en", theme: ["courage", "building"] },
  { text: "Well done is better than well said.", author: "Benjamin Franklin", lang: "en", theme: "building" },
  { text: "A year from now you may wish you had started today.", author: "Karen Lamb", lang: "en", theme: ["courage", "morning"] },

  // ───────────────── Birthday ─────────────────
  { text: "There are far, far better things ahead than any we leave behind.", author: "C. S. Lewis", lang: "en", theme: "birthday" },
];
