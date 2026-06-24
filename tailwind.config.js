/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#87A878',
          soft: '#D4E2C8',
          dark: '#6B8A5C',
          darker: '#4D6A42',
        },
        warning: '#E8B568',
        alert: '#B07853',
        bone: '#FAF7F2',
        graphite: '#3D3A35',
        divider: '#E8E4DC',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
      },
      boxShadow: {
        soft: '0 2px 8px rgba(58, 74, 79, 0.06)',
        card: '0 4px 16px rgba(58, 74, 79, 0.08)',
      },
    },
  },
  plugins: [],
}
