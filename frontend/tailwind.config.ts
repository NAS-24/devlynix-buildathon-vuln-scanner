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
        recon: {
          bgPrimary: "#1A1A1A",
          bgSurface: "#222222",
          bgCard: "#1E1E1E",
          accentGreen: "#1A6B3A",
          accentGreenLight: "#22883F",
          borderDefault: "#2A2A2A",
          borderHover: "#1A6B3A",
          textPrimary: "#E8E8E8",
          textMuted: "#888888",
          textHint: "#555555",
          critRed: "#C0392B",
          highOrange: "#E67E22",
          medYellow: "#F1C40F",
          lowGreen: "#2ECC71",
          codeBg: "#111111",
          codeText: "#7EC8A4",
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-roboto-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;