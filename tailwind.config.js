/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4CAF7C',
          soft: '#A8E6C9',
          dark: '#3E8E63',
        },
        warning: '#F4B860',
        'warning-dark': '#C77F2E',
        info: '#3B82F6',
        'info-dark': '#2563EB',
        alert: '#E57373',
        'alert-dark': '#DC2626',
        'alert-darker': '#B91C1C',
        bone: '#FAF8F5',
        graphite: '#3A4A4F',
        divider: '#E8ECEC',
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
