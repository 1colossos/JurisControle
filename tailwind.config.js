/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#0e1a36",
          800: "#13213f",
          700: "#1b2c52",
          600: "#243a66",
        },
        // Cores temáticas (claro/escuro) via variáveis CSS — ver index.css.
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        gold: {
          DEFAULT: "#e0a83a",
          600: "#d3982a",
          soft: "#f4d79b",
          bg: "rgb(var(--c-gold-bg) / <alpha-value>)",
        },
        canvas: "rgb(var(--c-canvas) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        line: "rgb(var(--c-line) / <alpha-value>)",
        "line-2": "rgb(var(--c-line2) / <alpha-value>)",
        body: "rgb(var(--c-body) / <alpha-value>)",
        "body-2": "rgb(var(--c-body2) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        critico: { DEFAULT: "#e0413a", bg: "rgb(var(--c-critico-bg) / <alpha-value>)" },
        alto: { DEFAULT: "#d3982a", bg: "rgb(var(--c-alto-bg) / <alpha-value>)" },
        medio: { DEFAULT: "#3b5bdb", bg: "rgb(var(--c-medio-bg) / <alpha-value>)" },
        baixo: { DEFAULT: "#1f9d57", bg: "rgb(var(--c-baixo-bg) / <alpha-value>)" },
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"Inter"', "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        mono: ['"JetBrains Mono"', '"SF Mono"', "Menlo", "Consolas", "monospace"],
      },
      borderRadius: { xl: "16px", "2xl": "22px" },
      boxShadow: {
        soft: "0 4px 16px rgba(16,24,40,.06)",
        lift: "0 18px 48px rgba(16,24,40,.16)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: { "fade-up": "fade-up .4s ease both" },
    },
  },
  plugins: [],
};
