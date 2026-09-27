import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cocoa: {
          950: '#221511',
          900: '#33261F',
          800: '#4A362C',
          700: '#6B4E3F',
          600: '#8A6A56',
        },
        gold: {
          DEFAULT: '#C9A227',
          light: '#E9CE7A',
          dark: '#8A6D1B',
        },
        cream: '#FAF5EA',
        champagne: '#F3E6C8',
      },
      fontFamily: {
        body: ['Vazirmatn', 'Tahoma', 'sans-serif'],
        display: ['Vazirmatn', 'Tahoma', 'sans-serif'],
        /** فونت کشیده انگلیسی برای اسم‌ها روی پاکت */
        en: ['Oswald', 'Arial Narrow', 'sans-serif'],
        /** فونت دست‌نویس رمانتیک (الهام از نستعلیق) برای اسم‌ها */
        script: ['Great Vibes', 'cursive'],
      },
    },
  },
  plugins: [],
};

export default config;
