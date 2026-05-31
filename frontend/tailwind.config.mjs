export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7c3aed',
          hover:   '#6d28d9',
          active:  '#5b21b6',
          light:   '#a78bfa',
        },
        brand: {
          bg:     '#09090b',
          surface:'#18181b',
          border: '#27272a',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        card: '1rem',
        btn:  '0.75rem',
      },
      spacing: {
        page: '1.5rem',
      },
      boxShadow: {
        glow:  '0 0 24px rgba(124, 58, 237, 0.25)',
        card:  '0 4px 16px rgba(0, 0, 0, 0.5)',
      },
      animation: {
        'fade-in':  'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.4s ease forwards',
        'spin-slow':'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },               to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      typography: {
        DEFAULT: {
          css: {
            color:            '#a1a1aa',
            maxWidth:         '65ch',
            'h1,h2,h3,h4':  { color: '#f4f4f5' },
            a:               { color: '#a78bfa' },
            strong:          { color: '#f4f4f5' },
            code:            { color: '#c4b5fd', backgroundColor: '#18181b' },
          },
        },
      },
    },
  },
  plugins: [],
};