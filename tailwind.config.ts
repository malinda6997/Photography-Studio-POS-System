import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f3f0ff",
          100: "#e9dfff",
          200: "#d6c3ff",
          300: "#b998ff",
          400: "#9563ff",
          500: "#7c3aed",
          600: "#5D0CE8",
          700: "#4c1d95",
          800: "#3730a3",
          900: "#312e81",
        },
      },
    },
  },
  plugins: [],
};

export default config;