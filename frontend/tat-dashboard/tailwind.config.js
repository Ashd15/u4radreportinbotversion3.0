/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // 👈 Enables dark mode via CSS class
  content: ["./src/**/*.{js,jsx,ts,tsx}"],  // ✅ This scans all relevant files in src and subfolders
  theme: {
    extend: {},
  },
  plugins: [],
}
