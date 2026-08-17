/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#12873A',
          secondary: '#16A34A',
          accent: '#22C55E',
          bg: '#F7F9F7',
          card: '#FFFFFF',
          text: '#172033',
          muted: '#64748B',
          border: '#E2E8F0',
        },
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#16a34a', // vibrant forest green
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#14532d',
          950: '#052e16',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
