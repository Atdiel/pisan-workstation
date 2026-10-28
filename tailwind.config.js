/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/index.html',
    './src/renderer/src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F2240',
          teal: '#00A896',
          'teal-light': '#33C4B3'
        },
        dark: {
          bg: '#090D16',
          sidebar: '#0D131F',
          card: '#131C2E',
          border: '#1E2B45'
        }
      }
    }
  },
  plugins: []
}