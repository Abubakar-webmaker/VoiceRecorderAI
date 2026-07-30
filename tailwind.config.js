/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './App.tsx', './index.js'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Navy Black
        navy: {
          950: '#040609',
          900: '#080B14',
          850: '#0C1020',
          800: '#0F1320',
          750: '#131929',
          700: '#181F33',
          600: '#1E273D',
          500: '#2A3454',
          400: '#3D4F73',
        },
        // Indigo (primary)
        primary: {
          DEFAULT: '#6366F1',
          light:   '#818CF8',
          dark:    '#4338CA',
          50:      '#EEF2FF',
        },
        // Coral (recording)
        recording: {
          DEFAULT: '#FF6B6B',
          light:   '#FF8E8E',
          dark:    '#E53E3E',
          pulse:   'rgba(255, 107, 107, 0.35)',
        },
        // Mint (AI/success)
        ai: {
          DEFAULT: '#4ECDC4',
          light:   '#6EE7E0',
          dark:    '#0D9488',
        },
      },
      fontFamily: {
        sans: ['System'],
        mono: ['Courier New', 'monospace'],
      },
      spacing: {
        '4.5': '18px',
        '5.5': '22px',
        '13':  '52px',
        '15':  '60px',
        '18':  '72px',
      },
      borderRadius: {
        '4xl': '32px',
      },
    },
  },
  plugins: [],
};