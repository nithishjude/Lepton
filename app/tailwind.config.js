/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        circle: {
          cyan: '#00C2FF',
          dark: '#0A0A0F',
          amber: '#F59E0B'
        }
      }
    },
  },
  plugins: [],
}
