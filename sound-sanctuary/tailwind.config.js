module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        neonBlue: '#00eaff',
        neonGreen: '#39ff14',
        neonPurple: '#a259ff',
        neonYellow: '#fff700',
        neonTurquoise: '#1fffd7',
      },
      boxShadow: {
        neon: '0 0 8px 2px #00eaff, 0 0 32px 8px #00eaff',
      },
    },
  },
  plugins: [],
};
