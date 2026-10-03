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
        // "Ahmed's World" — Lantern Night.
        // Same token names used everywhere in the app; only the values
        // change here, so this repaints the whole product at once.
        //
        // THE RULE: `lantern` is the one warm accent and is reserved for
        // the single most important thing on a screen (the main CTA, the
        // "matters now" card, the progress ring). Everything decorative --
        // active states, icon tints, links, focus rings, progress fills --
        // uses `sage` (calm) or plain `ink`. That restraint is what makes
        // ten different hubs feel like one app.
        night: {
          DEFAULT: "#0F2420", // page background, dark mode
          soft: "#112622",    // panel level
          card: "#132A26",    // raised surfaces, dark mode
        },
        paper: {
          DEFAULT: "#F7F3E8", // page background, light mode
          card: "#FFFFFF",    // raised surfaces, light mode
        },
        lantern: {
          DEFAULT: "#D6870F", // the one accent — warmer, more saturated gold
          soft: "#F2AE33",    // brighter tone (dark mode / glows)
          ink: "#2B1F08",     // text placed ON a lantern fill
        },
        ember: {
          DEFAULT: "#D6870F", // alias of lantern
          soft: "#F2AE33",
        },
        dusk: {
          DEFAULT: "#6F4FC4", // Hamzawi's own identity — richer violet, same role
          soft: "#A58EE8",
        },
        ink: {
          DEFAULT: "#17281F", // primary text on light
          muted: "#5C6F65",   // secondary text on light
        },
        moon: {
          DEFAULT: "#F7EFDD", // primary text on dark
          muted: "#9FB8AC",   // secondary text on dark
        },
        sage: {
          DEFAULT: "#2E8B63", // calm secondary: completed, growth, active — livelier emerald
          soft: "#6FC79A",    // same, tuned for dark backgrounds
        },
        clay: {
          DEFAULT: "#C45A3B", // rare warmth touch (mood, Business hub) — warmer terracotta
          soft: "#DB7B57",
        },
        hairline: {
          DEFAULT: "#E7E0D0", // borders on light
          dark: "#1B332D",    // borders on dark
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
        lantern: "0 8px 30px -10px rgba(214, 135, 15, 0.32)",
        glow: "0 0 40px -8px rgba(214, 135, 15, 0.42)",
        duskGlow: "0 0 50px -12px rgba(111, 79, 196, 0.5)",
        card: "0 1px 2px rgba(23, 40, 31, 0.04), 0 8px 24px -12px rgba(23, 40, 31, 0.08)",
        cardDark: "0 1px 2px rgba(0,0,0,0.2), 0 12px 32px -12px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        aurora:
          "radial-gradient(600px circle at 15% 0%, rgba(214,135,15,0.16), transparent 55%), radial-gradient(500px circle at 85% 10%, rgba(46,139,99,0.18), transparent 55%)",
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
