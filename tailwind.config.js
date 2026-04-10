/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary - Industrial Slate
        slate: {
          950: '#0a0f1a',
          900: '#0f172a',
          850: '#141c32',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9',
        },
        // Accent - Amber
        amber: {
          600: '#d97706',
          500: '#f59e0b',
          400: '#fbbf24',
          300: '#fcd34d',
          200: '#fde68a',
        },
        // Status colors
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
      },
      fontFamily: {
        rajdhani: ['Rajdhani_400Regular', 'Rajdhani_500Medium', 'Rajdhani_600SemiBold', 'Rajdhani_700Bold'],
        barlow: ['BarlowCondensed_400Regular', 'BarlowCondensed_500Medium', 'BarlowCondensed_600SemiBold', 'BarlowCondensed_700Bold'],
      },
    },
  },
  plugins: [],
};
