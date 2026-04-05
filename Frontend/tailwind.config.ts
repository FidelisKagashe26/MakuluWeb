import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"]
      },
      colors: {
        church: {
          50: "#f4f8ff",
          100: "#e7f0ff",
          200: "#c7dcff",
          300: "#9bc0ff",
          400: "#6999ff",
          500: "#3f72ff",
          600: "#2e55f6",
          700: "#2543e2",
          800: "#2438b7",
          900: "#23378f",
          950: "#0f1a4d"
        }
      },
      boxShadow: {
        soft: "0 12px 35px rgba(18, 30, 84, 0.14)"
      },
      backgroundImage: {
        "hero-mesh":
          "radial-gradient(circle at 12% 5%, rgba(63,114,255,.34), transparent 32%), radial-gradient(circle at 92% 90%, rgba(14,165,233,.28), transparent 34%)"
      }
    }
  },
  plugins: []
};

export default config;
