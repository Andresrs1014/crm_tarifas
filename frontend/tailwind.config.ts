import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ZYMO Dark Design System — exact colors from prototype HTML
        bg:       '#0a0e1a',
        surface:  '#111827',
        surface2: '#1a2235',
        surface3: '#1e2d45',
        accent:   '#00c2ff',
        accent2:  '#0077ff',
        cyan:     '#00ffcc',
        gold:     '#f5a623',
        success:  '#00e676',
        danger:   '#ff4444',
        purple:   '#a855f7',
        muted:    '#8899b4',
        border:   '#1e3050',
        foreground: '#e8edf5',
      },
      fontFamily: {
        sans:    ['DM Sans', 'sans-serif'],
        mono:    ['DM Mono', 'monospace'],
        display: ['Outfit', 'DM Sans', 'sans-serif'], // headings & big numbers
      },
      fontSize: {
        '2xs': '0.625rem',
      },
      boxShadow: {
        'accent': '0 0 20px rgba(0, 194, 255, 0.3)',
        'gold':   '0 0 20px rgba(245, 166, 35, 0.3)',
        'card':   '0 4px 24px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-in-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
} satisfies Config
