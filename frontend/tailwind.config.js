/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        carbon: {
          light: '#27272a',
          DEFAULT: '#18181b',
          dark: '#09090b',
          deep: '#121212',
        },
        cyan: {
          precision: '#0ea5e9',
          glow: 'rgba(14, 165, 233, 0.3)',
        },
        emerald: {
          success: '#10b981',
          glow: 'rgba(16, 185, 129, 0.2)',
        },
        rose: {
          fraud: '#f43f5e',
          glow: 'rgba(244, 63, 94, 0.2)',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
