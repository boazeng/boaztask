/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#1F3A5F',
        'primary-light': '#2A4F7A',
        'primary-soft': 'rgba(31, 58, 95, 0.07)',
        accent: '#D64A2E',
        pos: '#2F8F5B',
        warn: '#C99238',
        ink: '#1C1B19',
        cream: '#FAF9F5',
        'cream-white': '#FFFEFB',
        'warm-ink': '#2A2A28',
        taupe: '#706A60',
        'cream-text': '#F4F1EA',
        'warm-border': '#E7E2D6',
      },
      fontFamily: {
        sans: ['Heebo', 'Assistant', 'Segoe UI', 'Tahoma', 'Arial', 'sans-serif'],
        en: ['"Space Grotesk"', 'Heebo', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
