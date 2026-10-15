/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Ahmed's World" — Gilded Manuscript.
        // Same token names used everywhere in the app; only the values
        // change here, so this repaints the whole product at once.
        // Replaces the old "Lantern Night" palette (too orange/flat for
        // what she wanted: "فخمة وبريميم... حاجة فوق الروعة"). The new
        // direction takes its cue from illuminated Arabic manuscripts —
        // parchment, gold leaf, lapis and jade ink — rather than a
        // generic SaaS dark-mode green.
        //
        // THE RULE still holds: `lantern` is the one warm accent and is
        // reserved for the single most important thing on a screen (the
        // main CTA, the "matters now" card, the progress ring). Everything
        // decorative -- active states, icon tints, links, focus rings,
        // progress fills -- uses `sage` (calm) or plain `ink`. That
        // restraint is what makes ten different hubs feel like one app.
        night: {
          DEFAULT: "#0A1816", // page background, dark mode — deep ink-teal, not flat green
          soft: "#0D1D1A",    // panel level
          card: "#112422",    // raised surfaces, dark mode
        },
        paper: {
          DEFAULT: "#FAF4E6", // page background, light mode — warm parchment
          card: "#FFFDF8",    // raised surfaces, light mode
        },
        lantern: {
          DEFAULT: "#C2922F", // the one accent — true antique gold leaf, not orange
          soft: "#E8C468",    // brighter tone (dark mode / glows)
          ink: "#2B1D08",     // text placed ON a lantern fill
        },
        ember: {
          DEFAULT: "#C2922F", // alias of lantern
          soft: "#E8C468",
        },
        dusk: {
          DEFAULT: "#5B3FA0", // Hamzawi's own identity — deep amethyst, same role
          soft: "#9B82D9",
        },
        ink: {
          DEFAULT: "#162420", // primary text on light
          muted: "#5B6E65",   // secondary text on light
        },
        moon: {
          DEFAULT: "#F5EEDC", // primary text on dark
          muted: "#9BB3A8",   // secondary text on dark
        },
        sage: {
          DEFAULT: "#1F7A5C", // calm secondary: completed, growth, active — deep jade
          soft: "#5FBF95",    // same, tuned for dark backgrounds
        },
        clay: {
          DEFAULT: "#AE4F2E", // rare warmth touch (mood, Business hub) — rosewood terracotta
          soft: "#D97A54",
        },
        hairline: {
          DEFAULT: "#E9DFC6", // borders on light — warm parchment line, not grey
          dark: "#1A2E2A",    // borders on dark
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        letter: ["var(--font-letter)", "serif"],
      },
      borderRadius: {
        card: "20px",  // primary cards
        chip: "14px",  // small stat chips
        soft: "18px",
        full_card: "28px",
        xl2: "24px",
      },
      boxShadow: {
        lantern: "0 8px 30px -10px rgba(194, 146, 47, 0.38)",
        glow: "0 0 40px -8px rgba(194, 146, 47, 0.46)",
        duskGlow: "0 0 50px -12px rgba(91, 63, 160, 0.52)",
        card: "0 1px 2px rgba(22, 36, 32, 0.04), 0 8px 24px -12px rgba(22, 36, 32, 0.08)",
        cardDark: "0 1px 2px rgba(0,0,0,0.25), 0 12px 32px -12px rgba(0,0,0,0.55)",
      },
      backgroundImage: {
        // The hero-moment gradient: gold leaf catching light, not a flat fill.
        gilded:
          "linear-gradient(135deg, #C2922F 0%, #D9A93F 45%, #E8C468 100%)",
        aurora:
          "radial-gradient(600px circle at 15% 0%, rgba(194,146,47,0.18), transparent 55%), radial-gradient(500px circle at 85% 10%, rgba(31,122,92,0.2), transparent 55%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
