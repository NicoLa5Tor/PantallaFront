/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{html,ts}'
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"SF Pro Display"', 'system-ui', 'sans-serif'],
        body: ['"SF Pro Text"', 'system-ui', 'sans-serif']
      },
      colors: {
        rescue: {
          50: '#f6f7fb',
          100: '#eef1f8',
          200: '#d8deed',
          300: '#b7c3de',
          400: '#8ca0c8',
          500: '#6f84b6',
          600: '#55679e',
          700: '#415081',
          800: '#2d375e',
          900: '#1a243e'
        }
      }
    }
  },
  plugins: []
};
