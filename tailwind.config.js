/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cinema: {
          bg: '#07070b',
          surface: '#111118',
          card: '#181822',
          elevated: '#22222e',
          border: '#2a2a38',
          muted: '#9a9aab',
          accent: '#f84464',
          gold: '#f5c518',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(248, 68, 100, 0.25)',
      },
      backgroundImage: {
        'hero-fade':
          'linear-gradient(90deg, rgba(7,7,11,0.95) 0%, rgba(7,7,11,0.55) 48%, rgba(7,7,11,0.2) 100%)',
        screen:
          'linear-gradient(180deg, rgba(248,68,100,0.45) 0%, rgba(248,68,100,0.05) 100%)',
      },
    },
  },
  plugins: [],
};
