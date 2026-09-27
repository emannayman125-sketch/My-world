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
        // "Ahmed's World" palette — Navy Copper (approved).
        // Same token names used everywhere in the app; only the hex
        // values change here, so this repaints the whole product at once.
        night: {
          DEFAULT: "#18232D", // deep navy — base dark background
          soft: "#1E2C38",    // panel level
          card: "#263744",    // card surfaces on dark
        },
        paper: {
          DEFAULT: "#F7F5EF", // warm white — base light background
          card: "#FCFBF7",    // card surfaces on light
        },
        lantern: {
          DEFAULT: "#B46F4D", // copper — primary accent
          soft: "#D8C6AF",    // sand — secondary touch
        },
        ember: {
          DEFAULT: "#B46F4D", // copper — same family as lantern; kept as a
          soft: "#D8C6AF",    // separate token for spots that want to name it
        },
        dusk: {
          DEFAULT: "#6256A8", // deep indigo — secondary accent (Hamzawi / AI)
          soft: "#9086C0",
        },
        ink: {
          DEFAULT: "#18232D", // primary text on light — deep navy
          muted: "#7F8C83",   // sage gray
        },
        moon: {
          DEFAULT: "#F7F5EF", // primary text on dark
          muted: "#93A0A3",   // muted sage-gray, readable on navy
        },
        sage: {
          DEFAULT: "#879786", // muted sage — Growth accent
          soft: "#A9B4A8",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        letter: ["var(--font-letter)", "serif"],
      },
      borderRadius: {
        soft: "18px",
        full_card: "28px",
        xl2: "24px",
      },
      boxShadow: {
        lantern: "0 8px 30px -10px rgba(180, 111, 77, 0.35)",
        glow: "0 0 40px -8px rgba(180, 111, 77, 0.45)",
        duskGlow: "0 0 50px -12px rgba(98, 86, 168, 0.5)",
        card: "0 1px 2px rgba(24, 35, 45, 0.04), 0 8px 24px -12px rgba(24, 35, 45, 0.08)",
        cardDark: "0 1px 2px rgba(0,0,0,0.2), 0 12px 32px -12px rgba(0,0,0,0.5)",
      },
      backgroundImage: {
        aurora:
          "radial-gradient(600px circle at 15% 0%, rgba(180,111,77,0.14), transparent 55%), radial-gradient(500px circle at 85% 10%, rgba(98,86,168,0.18), transparent 55%)",
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
