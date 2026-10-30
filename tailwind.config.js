/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: '#39ff14',
        void: '#07090a',
        panel: '#0e1311',
      },
      fontFamily: {
        display: ['"Bungee"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 12px rgba(57,255,20,.6), 0 0 32px rgba(57,255,20,.25)',
      },
    },
  },
  plugins: [],
};
