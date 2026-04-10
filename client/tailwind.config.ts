import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Podwires brand — indigo/purple family (#4840B0 primary)
        brand: {
          50:  '#f0effd',
          100: '#dddcfa',
          200: '#bcb9f5',
          300: '#9b96ef',
          400: '#7a73e8',
          500: '#5a50e0',
          600: '#4840B0',  // Podwires primary accent
          700: '#3D3A80',  // Podwires accent-alt
          800: '#2d2a60',
          900: '#1D1C2E',  // Podwires text dark
        },
        // Dark backgrounds (#0f0e2a theme-color from podwires.com)
        ink: {
          50:  '#f0effd',
          100: '#e0dff5',
          200: '#b8b6cc',
          300: '#8e8ca4',
          400: '#5C5A72',  // Podwires muted text
          500: '#3d3a60',
          600: '#2d2a4a',
          700: '#1e1c38',
          800: '#15142e',
          900: '#0f0e2a',  // Podwires dark bg
        },
        // Accent — violet for highlights
        accent: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
