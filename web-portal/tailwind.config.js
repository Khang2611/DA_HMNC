/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#806C79', // Moonscape
          dark: '#16131F', // Back in Black
          light: '#F0D9E4', // Mountain Heather
          secondary: '#C1A0AC', // Decanting
          surface: '#4A3F4B', // Funkie Friday
          upper: '#3E3440', // Softened Funkie Friday
          bg: '#16131F',
          surfaceL1: '#1E1826',
          surfaceL2: '#201A27',
          surfaceL3: '#282132',
          borderSubtle: 'rgba(240, 217, 228, 0.08)',
          borderMauve: 'rgba(193, 160, 172, 0.25)',
          borderHighlight: 'rgba(255, 255, 255, 0.22)',
          glowMauve: 'rgba(128, 108, 121, 0.15)',
          glowDecanting: 'rgba(193, 160, 172, 0.10)',
        },
        financial: {
          income: '#32D74B',
          expense: '#FF453A',
          success: '#34C759',
          warning: '#FF9500',
          error: '#FF3B30',
          info: '#5856D6',
        }
      },
      borderRadius: {
        'sm': '10px',
        'md': '14px',
        'lg': '18px',
        'xl': '22px',
        '2xl': '30px',
      },
      boxShadow: {
        'glass': '0 6px 16px rgba(0, 0, 0, 0.25)',
        'floating': '0 10px 24px rgba(0, 0, 0, 0.4)',
      }
    },
  },
  plugins: [],
}

