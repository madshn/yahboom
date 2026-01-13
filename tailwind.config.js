/** @type {import('tailwindcss').Config} */
export default {
  content: ['./public/**/*.{html,js}'],
  theme: {
    extend: {
      colors: {
        primary: '#9eff3d',
        'background-light': '#f7f8f5',
        'background-dark': '#19230f',
        beginner: '#339933',
        intermediate: '#FF8C00',
        advanced: '#CC3333',
      },
      fontFamily: {
        display: ['Spline Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
}
