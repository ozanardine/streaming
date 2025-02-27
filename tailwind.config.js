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
          DEFAULT: '#e91e63', // Bright pink from logo
          dark: '#c2185b',    // Darker pink
          light: '#f48fb1',   // Lighter pink
          lighter: '#fce4ec', // Very light pink for hover states
        },
        secondary: {
          DEFAULT: '#ff4081', // Accent pink
          dark: '#f50057',
          light: '#ff80ab',
        },
        background: {
          DEFAULT: '#121212', // Dark background
          dark: '#0a0a0a',    // Darker background
          light: '#1e1e1e',   // Lighter dark background
          card: '#242424',    // Card background
        },
        text: {
          DEFAULT: '#ffffff',
          secondary: '#b3b3b3',
          muted: '#757575',
        },
        success: {
          DEFAULT: '#4caf50',
          light: '#a5d6a7',
        },
        warning: {
          DEFAULT: '#ff9800',
          light: '#ffcc80',
        },
        error: {
          DEFAULT: '#f44336',
          light: '#e57373',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Netflix Sans', 'Helvetica Neue', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      boxShadow: {
        'menu': '0 0 15px rgba(0, 0, 0, 0.8)',
        'card': '0 10px 30px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 14px 36px rgba(233, 30, 99, 0.2)',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade': 'fadeIn 0.5s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-pink': 'linear-gradient(135deg, #e91e63 0%, #ff4081 100%)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/forms'),
  ],
}