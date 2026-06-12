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
          50: '#fff5f0',
          100: '#ffe8e0',
          200: '#ffd1c0',
          300: '#ffb3a0',
          400: '#ff8f66',
          500: '#FF6B35',
          600: '#e55a2b',
          700: '#cc4a21',
          800: '#b33a17',
          900: '#9a2a0d',
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Disable Tailwind's base styles to work with MUI
  },
}

