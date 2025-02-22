/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'slide-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' }
        }
      },
      animation: {
        'slide-in': 'slide-in 0.3s ease-out'
      },
      colors: {
        primary: {
          DEFAULT: '#3C1361', // Deep Purple
          light: '#3C1361/5',
          hover: '#3C1361/80',
        },
        secondary: {
          DEFAULT: '#A78BFA', // Soft Lilac
          light: '#A78BFA/20',
          hover: '#A78BFA/50',
        },
        accent: {
          DEFAULT: '#F1C40F', // Refined Gold
          light: '#F1C40F/20',
          hover: '#F1C40F/80',
        },
        neutral: {
          light: '#F5F5F5', // Light Neutral
          dark: '#1E1E1E',  // Dark Neutral
        },
      },
      gradientColorStops: theme => ({
        'primary': '#3C1361',
        'secondary': '#A78BFA',
        'accent': '#F1C40F',
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};