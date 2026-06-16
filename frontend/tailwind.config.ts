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
          // Primary colors
          yellow:  '#FFC107',
          'yellow-2': '#F9C234',
          'yellow-bg': '#FFFCF5',
          'yellow-light': '#FFFCF5',
          'yellow-text': '#FFC107',
          'yellow-border': '#FFC107',
          
          // Text colors
          text:    '#101010',
          muted:   '#444444',
          subtle:  '#666666',
          'text-secondary': '#6B7280',
          'text-tertiary': '#9CA3AF',
          
          // Background colors
          light:   '#fafafa',
          'light-alt': '#F9FAFB',
          background: '#FFFFFF',
          
          // Border colors
          border:  '#E8E8E8',
          'border-alt': '#E5E7EB',
          
          // Semantic colors
          purple:  '#4B218B',
          'purple-2': '#5B21B6',
          'purple-light': '#FFFBEE',
          'purple-text': '#7C3AED',
          'purple-bg': '#F5F3FF',
          
          gold: '#B8860B',
          'gold-bg': '#FFF9E6',
          'gold-border': '#FFE082',
          
          'red-soft': '#EF4444',
          'red-bg': '#FEF2F2',
          
          'green-soft': '#22C55E',
          'green-bg': '#F0FFF4',
          
          'blue-soft': '#3B82F6',
          'blue-bg': '#EFF6FF',
          
          // Status colors
          success: '#22C55E',
          error: '#EF4444',
          warning: '#F59E0B',
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
