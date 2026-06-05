import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Notion-inspired palette ──────────────────────────────────────────
        // Warm near-black text on warm light greys, hairline borders, one blue.
        notion: {
          text:   '#37352f', // primary text (warm near-black)
          sub:    '#787774', // secondary text
          faint:  '#9b9a97', // tertiary / placeholder
          bg:     '#ffffff', // page background
          sidebar:'#f7f7f5', // sidebar / rail
          panel:  '#fbfbfa', // subtle panel fill (table headers, wells)
          line:   '#ededec', // hairline border
          line2:  '#e3e2e0', // slightly stronger border
          hover:  '#f1f1ef', // hover surface
          sel:    '#eceae8', // selected surface
          blue:   '#2383e2', // accent / primary action
          bluedk: '#0b6fc9', // accent hover
          red:    '#e03e3e', // destructive
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont',
          'Segoe UI', 'Inter', 'Helvetica', 'Arial', 'sans-serif',
        ],
      },
      borderRadius: {
        // Notion uses small, gentle radii
        DEFAULT: '4px',
      },
      boxShadow: {
        // Soft, low-contrast elevation — Notion leans on borders, not shadows
        notion: '0 1px 2px rgba(15,15,15,0.05), 0 2px 8px rgba(15,15,15,0.04)',
        'notion-lg': '0 4px 16px rgba(15,15,15,0.10), 0 0 0 1px rgba(15,15,15,0.04)',
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in-up':     'fadeInUp 0.3s ease-out both',
        'fade-in':        'fadeIn 0.25s ease-out both',
        'slide-in-right': 'slideInRight 0.26s cubic-bezier(0.22,1,0.36,1) both',
        'scale-in':       'scaleIn 0.16s ease-out both',
      },
    },
  },
  plugins: [],
}

export default config
