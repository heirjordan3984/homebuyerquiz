/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0D1B2A',
          light: '#152537',
          muted: '#1E2F42',
        },
        gold: {
          DEFAULT: '#C9A84C',
          light: '#D4B86A',
          muted: '#C9A84C26',
          faint: '#C9A84C12',
        },
        cream: {
          DEFAULT: '#F5F0E8',
          dark: '#EDE6D6',
        },
        ink: '#1A1A1A',
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        dm: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
