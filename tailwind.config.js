/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        school: {
          blue: '#0B7BA7',
          darkblue: '#00558F',
          cyan: '#00A8B5',
          teal: '#00A896',
          orange: '#F39200',
          orangehover: '#D97A09',
          lightbg: '#F0F8FA',
          border: '#D0E4F5',
          surface: '#F7F9FF',
          slate: '#091D2E'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 6px 20px -4px rgba(11, 123, 167, 0.08)',
        'lifted': '0 12px 28px -6px rgba(11, 123, 167, 0.12)',
        'glow': '0 0 20px rgba(11, 123, 167, 0.15)',
      }
    },
  },
  plugins: [],
}
