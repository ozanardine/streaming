/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/pages/**/*.{js,ts,jsx,tsx}",
      "./src/components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#e50914',
            dark: '#b30710',
            light: '#f3636b',
          },
          background: {
            DEFAULT: '#141414',
            dark: '#0a0a0a',
            light: '#232323',
            card: '#181818',
          },
          text: {
            DEFAULT: '#ffffff',
            secondary: '#8c8c8c',
            muted: '#6d6d6e',
          }
        },
        fontFamily: {
          sans: ['Netflix Sans', 'Helvetica Neue', 'Segoe UI', 'Arial', 'sans-serif'],
        },
        spacing: {
          '72': '18rem',
          '84': '21rem',
          '96': '24rem',
        },
        boxShadow: {
          'menu': '0 0 15px rgba(0, 0, 0, 0.8)',
          'card': '0 10px 30px rgba(0, 0, 0, 0.5)',
        },
        transitionProperty: {
          'height': 'height',
          'spacing': 'margin, padding',
        }
      },
    },
    plugins: [
      require('@tailwindcss/aspect-ratio'),
      require('@tailwindcss/forms'),
    ],
  }