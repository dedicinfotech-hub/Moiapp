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
          'yellow-light': '#FFFCF5',
          'yellow-text': '#FFC107',
          'yellow-border': '#FFC107',
          border:  '#E8E8E8',
          text:    '#101010',
          muted:   '#444444',
          subtle:  '#666666',
          light:   '#fafafa',
          purple:  '#4B218B',
          'purple-2': '#5B21B6',
          'purple-light': '#FFFBEE',
          'purple-text': '#7C3AED',
          gold: '#B8860B',
          'gold-bg': '#FFF9E6',
          'gold-border': '#FFE082',
          'red-soft': '#EF4444',
          'green-soft': '#22C55E',
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
