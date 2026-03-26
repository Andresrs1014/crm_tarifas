/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       '#0a0e1a',
        surface:  '#111827',
        surface2: '#1a2235',
        surface3: '#1e2d45',
        accent:   '#00c2ff',
        accent2:  '#0077ff',
        gold:     '#f5a623',
        success:  '#00e676',
        danger:   '#ff4444',
        purple:   '#a855f7',
        muted:    '#8899b4',
        border:   '#1e3050',
      },
      fontFamily: {
        sans:      ['Barlow', 'sans-serif'],
        condensed: ['Barlow Condensed', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
