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
          950: "#000000",
          900: "#0a0a0a",
          800: "#171717",
          700: "#262626",
          600: "#404040",
          500: "#525252",
          400: "#737373",
        },
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          400: "#6ee7b7",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
        },
        gold: {
          400: "#a3a3a3",
          500: "#737373",
        },
        ink: {
          950: "#000000",
          900: "#0a0a0a",
          800: "#171717",
          700: "#262626",
        },
      },
      boxShadow: {
        card: "0 16px 40px -28px rgba(0, 0, 0, 0.28)",
        lift: "0 22px 50px -30px rgba(0, 0, 0, 0.35)",
        glow: "0 0 0 1px rgba(0, 0, 0, 0.08), 0 16px 40px -24px rgba(0, 0, 0, 0.2)",
      },
      backgroundImage: {
        mesh: "radial-gradient(1200px 600px at 10% -10%, rgba(0,0,0,0.04), transparent 50%), radial-gradient(900px 500px at 100% 0%, rgba(0,0,0,0.03), transparent 45%)",
        grid: "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
