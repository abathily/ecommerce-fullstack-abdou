/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  darkMode: 'class', // active le dark mode via une classe 'dark'
  theme: {
    extend: {
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
        fadeInSlow: 'fadeIn 1.2s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
      // Tu peux aussi étendre les couleurs ici pour le mode sombre
      colors: {
        darkBg: '#1a202c', // exemple pour les fonds
        darkText: '#f0f0f0', // exemple pour le texte
      },
    },
  },
  plugins: [
    //require('@tailwindcss/line-clamp'),
  ],
};
