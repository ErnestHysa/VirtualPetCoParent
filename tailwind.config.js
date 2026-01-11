/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette - Whimsical Premium
        primary: {
          rose: '#E8B4B8',
          lavender: '#C5B9CD',
          sky: '#A7C7E7',
        },
        // Backgrounds
        background: {
          light: '#FAF8F5',
          dark: '#1A1A2E',
          'dark-secondary': '#16162A',
        },
        // Semantic colors
        semantic: {
          hunger: '#FFB5A7',
          happiness: '#FFE58F',
          energy: '#B5EAD7',
          love: '#FF9AA2',
        },
        // Neutral scale
        neutral: {
          50: '#FAF9F7',
          100: '#F5F3F0',
          200: '#E8E5E1',
          300: '#D4D0CA',
          400: '#B5B0A8',
          500: '#9A948B',
          600: '#7B756D',
          700: '#615E57',
          800: '#4D4A45',
          900: '#3F3C38',
        },
      },
      fontFamily: {
        // Apple-style system fonts
        display: ['System', 'sans-serif'],
        body: ['System', 'sans-serif'],
      },
      fontSize: {
        // Apple's type scale
        xs: ['11px', { lineHeight: '16px', letterSpacing: '0.02px' }],
        sm: ['12px', { lineHeight: '18px', letterSpacing: '0.02px' }],
        base: ['14px', { lineHeight: '20px', letterSpacing: '-0.01px' }],
        lg: ['17px', { lineHeight: '24px', letterSpacing: '-0.22px' }],
        xl: ['20px', { lineHeight: '28px', letterSpacing: '-0.33px' }],
        '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.5px' }],
        '3xl': ['32px', { lineHeight: '40px', letterSpacing: '-0.8px' }],
        '4xl': ['40px', { lineHeight: '48px', letterSpacing: '-1px' }],
      },
      spacing: {
        // Consistent spacing scale
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '3.5': '14px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      borderRadius: {
        // Subtle, refined rounded corners
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '18px',
        '2xl': '24px',
        '3xl': '32px',
        'full': '9999px',
      },
      boxShadow: {
        // Soft, multi-layered shadows
        'soft': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.08)',
        'large': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'glow': '0 0 20px rgba(232, 180, 184, 0.4)',
      },
      animation: {
        // Custom animations
        'breathe': 'breathe 3s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-10px) rotate(2deg)' },
          '66%': { transform: 'translateY(-5px) rotate(-2deg)' },
        },
      },
    },
  },
  plugins: [],
}
