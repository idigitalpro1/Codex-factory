/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ── Codex custom tokens ──────────────────────────────────
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

        // ── Dashtail / shadcn CSS-variable tokens ──────────────
        // These let Dashtail's CVA components resolve correctly.
        // Values live in index.css :root vars (dark editorial palette).
        background:           'hsl(var(--background) / <alpha-value>)',
        foreground:           'hsl(var(--foreground) / <alpha-value>)',
        border:               'hsl(var(--border) / <alpha-value>)',
        input:                'hsl(var(--input) / <alpha-value>)',
        ring:                 'hsl(var(--ring) / <alpha-value>)',
        muted: {
          DEFAULT:            'hsl(var(--muted) / <alpha-value>)',
          foreground:         'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT:            'hsl(var(--primary) / <alpha-value>)',
          foreground:         'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT:            'hsl(var(--secondary) / <alpha-value>)',
          foreground:         'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT:            'hsl(var(--accent) / <alpha-value>)',
          foreground:         'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT:            'hsl(var(--popover) / <alpha-value>)',
          foreground:         'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT:            'hsl(var(--card) / <alpha-value>)',
          foreground:         'hsl(var(--card-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT:            'hsl(var(--destructive) / <alpha-value>)',
          foreground:         'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        success: {
          DEFAULT:            'hsl(var(--success) / <alpha-value>)',
          foreground:         'hsl(var(--success-foreground) / <alpha-value>)',
        },
        warning: {
          DEFAULT:            'hsl(var(--warning) / <alpha-value>)',
          foreground:         'hsl(var(--warning-foreground) / <alpha-value>)',
        },
        info: {
          DEFAULT:            'hsl(var(--info) / <alpha-value>)',
          foreground:         'hsl(var(--info-foreground) / <alpha-value>)',
        },
      },

      fontFamily: {
        sans: ['"IBM Plex Sans"', '"Segoe UI"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"Fira Code"', 'monospace'],
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        card: '10px',
      },
    },
  },
  plugins: [],
}
