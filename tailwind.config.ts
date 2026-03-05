import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#202227",
        surfaceAlt: "#2a2d33",
        border: "#4a4f57",
        mapGlow: "#1ec9ff",
        success: "#1aba56",
        danger: "#f14646"
      },
      boxShadow: {
        panel: "0 16px 48px rgba(0, 0, 0, 0.32)"
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
