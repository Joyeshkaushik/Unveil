/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#080C14',
        surface: '#0D1321',
        border: '#1C2A3E',
        accent: '#00D4FF',
        accent2: '#7B61FF',
        muted: '#5A6A80',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      }
    },
  },
  plugins: [],
}