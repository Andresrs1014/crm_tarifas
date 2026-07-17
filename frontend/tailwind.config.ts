import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ZYMO Dark Design System — aligned with html-v6.css / tailwind.config.js
        bg:         '#080c14',
        surface:    '#0e1320',
        surface2:   '#131a28',
        surface3:   '#18212f',
        accent:     '#38bdf8',
        accent2:    '#0ea5e9',
        cyan:       '#00ffcc',
        gold:       '#f5a623',
        success:    '#34d399',
        danger:     '#f87171',
        purple:     '#a78bfa',
        muted:      '#94a3b8',
        border:     '#2a3a52',
        foreground: '#e2e8f0',
      },
      fontFamily: {
        sans:      ['Barlow', 'DM Sans', 'sans-serif'],
        mono:      ['DM Mono', 'monospace'],
        condensed: ['Barlow Condensed', 'sans-serif'],
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
