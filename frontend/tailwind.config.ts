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
        silent: {
          bg: "#1A1A1A",      // Deep Charcoal
          accent: "#1A6B3A",  // Forest Green
        },
      },
    },
  },
  plugins: [],
};
export default config;