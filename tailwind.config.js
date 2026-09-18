/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        muesli: {
          50: '#f6f7f2',
          100: '#e9ebdc',
          200: '#d5d9bd',
          300: '#bcc398',
          400: '#a2ab73',
          500: '#879255',
          600: '#6a7441',
          700: '#525a34',
          800: '#434a2d',
          900: '#393e28',
          950: '#1d2113',
        }
      }
    },
  },
  plugins: [],
}