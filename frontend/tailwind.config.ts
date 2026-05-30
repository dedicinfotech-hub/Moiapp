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
        tn: {
          yellow:  '#FFC107',
          'yellow-2': '#F9C234',
          'yellow-bg': '#FFFCF5',
          'yellow-border': '#FFC107',
          border:  '#E8E8E8',
          text:    '#101010',
          muted:   '#444444',
          subtle:  '#666666',
          light:   '#fafafa',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
