/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cx: {
          bg:     '#0c0c14',
          panel:  '#13131e',
          card:   '#1a1a2a',
          border: '#252535',
          text:   '#dde0ee',
          muted:  '#6366a0',
          blue:   '#1a6aff',
          gold:   '#c49a14',
          green:  '#16a34a',
          red:    '#dc2626',
          amber:  '#d97706',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"Segoe UI"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
}
