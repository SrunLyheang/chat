import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Semantic colors backed by the CSS variables in src/index.css.
      // Switch themes by changing data-theme on <html>; these all follow.
      colors: {
        ground: "rgb(var(--ground) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surface2: "rgb(var(--surface-2) / <alpha-value>)",
        edge: "rgb(var(--edge) / <alpha-value>)",
        content: "rgb(var(--content) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        primaryStrong: "rgb(var(--primary-strong) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        onPrimary: "rgb(var(--on-primary) / <alpha-value>)",
      },
      fontFamily: {
        sans: ['"Noto Sans Khmer"', "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
        display: ['"Playfair Display"', '"Moul"', "serif"],
      },
      animation: {
        border: "border 4s linear infinite",
        shimmer: "shimmer 2s infinite",
      },
      keyframes: {
        border: {
          to: { "--border-angle": "360deg" },
        },
      },
    },
  },
  plugins: [daisyui],
};
