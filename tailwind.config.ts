import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a0a0f",
          secondary: "#111118",
          card: "#16161f",
          elevated: "#1c1c28",
        },
        border: { DEFAULT: "#2a2a3a", bright: "#3a3a50" },
        accent: {
          green: "#00ffaa",
          purple: "#7c3aed",
          blue: "#0ea5e9",
          pink: "#ec4899",
          orange: "#ff6b35",
          amber: "#f59e0b",
          red: "#ef4444",
          teal: "#00ffaa",
          slate: "#94a3b8",
        },
        text: {
          primary: "#f0f0ff",
          secondary: "#9090b0",
          muted: "#5a5a7a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-brand": "linear-gradient(135deg, #00ffaa, #0ea5e9, #7c3aed)",
      },
      animation: {
        "fade-in": "fade-in 0.4s ease forwards",
        "slide-up": "slide-up 0.5s ease forwards",
        shimmer: "shimmer 1.5s infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
