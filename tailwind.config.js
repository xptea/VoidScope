/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,ts,tsx,jsx}"],
  theme: {
    extend: {
      // Add scrollbar hiding utilities
      display: ["scrollbar"] 
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide')
  ],
}