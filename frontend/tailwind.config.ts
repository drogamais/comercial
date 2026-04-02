import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0fe',
          200: '#ced9fd',
          300: '#b1c2fb',
          400: '#7694f8',
          500: '#3b66f5',
          600: '#355cdc',
          700: '#2c4db7',
          800: '#233d93',
          900: '#1d3278',
          950: '#111e48',
        },
        slate: {
          950: '#020617',
        }
      }
    },
  },
  plugins: [],
} satisfies Config
