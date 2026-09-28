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
          DEFAULT: "#C6832A", // the one accent
          soft: "#E8A83C",    // brighter tone (dark mode / glows)
          ink: "#2B1F08",     // text placed ON a lantern fill
        },
        ember: {
          DEFAULT: "#C6832A", // alias of lantern
          soft: "#E8A83C",
        },
        dusk: {
          DEFAULT: "#6256A8", // Hamzawi's own identity
          soft: "#9086C0",
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
          DEFAULT: "#4F7A63", // calm secondary: completed, growth, active
          soft: "#8FAE9A",    // same, tuned for dark backgrounds
        },
        clay: {
          DEFAULT: "#B5624A", // rare warmth touch (mood, Business hub)
          soft: "#C97D60",
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
        lantern: "0 8px 30px -10px rgba(198, 131, 42, 0.30)",
        glow: "0 0 40px -8px rgba(198, 131, 42, 0.40)",
        duskGlow: "0 0 50px -12px rgba(98, 86, 168, 0.5)",
        card: "0 1px 2px rgba(23, 40, 31, 0.04), 0 8px 24px -12px rgba(23, 40, 31, 0.08)",
        cardDark: "0 1px 2px rgba(0,0,0,0.2), 0 12px 32px -12px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        aurora:
          "radial-gradient(600px circle at 15% 0%, rgba(198,131,42,0.12), transparent 55%), radial-gradient(500px circle at 85% 10%, rgba(79,122,99,0.14), transparent 55%)",
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
