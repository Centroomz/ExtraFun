/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  corePlugins: { preflight: false }, // keep existing reset in src/index.css
  theme: {
    extend: {
      colors: {
        background: '#121414',
        surface: '#121414',
        'surface-dim': '#121414',
        'surface-container-lowest': '#0c0f0f',
        'surface-container-low': '#1a1c1c',
        'surface-container': '#1e2020',
        'surface-container-high': '#282a2b',
        'surface-container-highest': '#333535',
        'on-surface': '#e2e2e2',
        'on-surface-variant': '#d0c5af',
        outline: '#99907c',
        'outline-variant': '#4d4635',
        primary: '#f2ca50',
        'primary-container': '#d4af37',
        'on-primary': '#3c2f00',
        secondary: '#c6c4df',
        error: '#ffb4ab',
      },
      fontFamily: {
        display: ['"Bodoni Moda"', 'Georgia', 'serif'],
        body: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['64px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg-mobile': ['40px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'headline-md': ['32px', { lineHeight: '1.3' }],
        'headline-sm': ['24px', { lineHeight: '1.4' }],
        'body-lg': ['18px', { lineHeight: '1.6', letterSpacing: '0.01em' }],
        'body-md': ['15px', { lineHeight: '1.6' }],
        'label-caps': ['12px', { lineHeight: '1', letterSpacing: '0.3em' }],
      },
      maxWidth: { 'container-max': '1280px' },
    },
  },
  plugins: [],
}
