/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Change this palette to re-theme the whole app
        brand: {
          50: '#effaf8', 100: '#d3f3ee', 200: '#a8e6dd', 300: '#74d2c7', 400: '#41b8ac',
          500: '#229e93', 600: '#16807a', 700: '#14665f', 800: '#13514d', 900: '#12433f', 950: '#08282a',
        },
        ink: { 800: '#0e3338', 900: '#0a2629', 950: '#071b1e' },
      },
    },
  },
  plugins: [],
}
