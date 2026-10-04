import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        navy: {
          950: "#070c18",
          900: "#0b1329",
          800: "#132140",
          700: "#1e3258",
          600: "#2c4575",
          500: "#476194",
          400: "#64748b",
          300: "#94a3b8",
          200: "#cbd5e1",
          100: "#f1f5f9",
          50: "#f8fafc",
        },
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        emerald: {
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
        gold: {
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        ink: {
          950: "#070c18",
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
          600: "#475569",
        },
      },
      boxShadow: {
        card: "0 10px 30px -10px rgba(11, 19, 41, 0.08)",
        "card-hover": "0 20px 40px -15px rgba(11, 19, 41, 0.14)",
        lift: "0 22px 50px -25px rgba(11, 19, 41, 0.18)",
        glow: "0 0 25px -5px rgba(16, 185, 129, 0.25)",
        "glow-lg": "0 0 40px -5px rgba(16, 185, 129, 0.35)",
        "glow-indigo": "0 0 35px -5px rgba(79, 70, 229, 0.25)",
      },
      backgroundImage: {
        mesh: "radial-gradient(1200px 600px at 10% -10%, rgba(16,185,129,0.06), transparent 50%), radial-gradient(900px 500px at 100% 0%, rgba(79,70,229,0.05), transparent 45%)",
        grid: "linear-gradient(rgba(15,23,42,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.03) 1px, transparent 1px)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float-slow": "float 6s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
