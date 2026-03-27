/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        cms: {
          primary: '#2563eb',
          'primary-hover': '#1d4ed8',
          surface: '#f8fafc',
          border: '#e2e8f0',
        },
      },
    },
  },
  plugins: [],
};
