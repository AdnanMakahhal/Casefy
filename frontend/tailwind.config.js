/**
 * Casefy design tokens, taken from the approved Claude Design prototype.
 * Components must use these token names (e.g. `bg-brand`, `text-muted`,
 * `border-line`) instead of hard-coded hex values.
 *
 * @type {import('tailwindcss').Config}
 */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Text and dark surfaces (sidebar, code blocks, toasts)
        ink: '#021316',
        // Primary actions, active states, selected chips
        brand: {
          DEFAULT: '#26444A',
          hover: '#021316',
        },
        // Secondary and tertiary text
        muted: '#446067',
        subtle: '#738289',

        // Borders
        line: {
          DEFAULT: '#B3BEC1', // cards and panels
          strong: '#A9B4B8', // inputs, secondary buttons
          soft: '#D3DADB', // inner groups
          divider: '#9AA6AA', // project tab underline
        },

        // Backgrounds
        surface: '#FFFFFF',
        canvas: '#CDD5D7', // app page background
        mist: '#E3E8E9', // table headers, progress tracks, subtle fills
        skeleton: '#E6EAEB',
        hover: '#F0F2F3', // row hover, drop zone
        tint: '#F2F4F4', // grouped option background
        selected: '#ECEFF0', // table row hover
        read: '#F7F8F8', // read notification background

        // Sidebar (on ink)
        sidebar: {
          DEFAULT: '#021316',
          active: '#26444A',
          border: '#26444A',
          text: '#A9B4B8',
          marker: '#738289',
        },

        // Status colors: each has a soft background, border, dot and text
        success: {
          bg: '#E3EEE7',
          border: '#B9D3C3',
          dot: '#3F7D5C',
          text: '#2E6248',
        },
        danger: {
          bg: '#F5E1DF',
          border: '#E2B9B5',
          dot: '#A9443D',
          text: '#8E3530',
          soft: '#F2C9C5', // danger text on dark backgrounds
        },
        warning: {
          bg: '#F5EAD3',
          border: '#E3CB9C',
          dot: '#B07A1E',
          text: '#7A5212',
        },

        // Test type pills
        type: {
          positive: '#021316',
          negative: '#26444A',
          edge: '#D3DADB',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xs: '5px', // small sub-tags
        sm: '6px', // type pills
        md: '8px', // small buttons
        DEFAULT: '10px', // inputs and buttons
        lg: '12px', // dropdowns, toasts
        xl: '14px', // cards
        '2xl': '16px', // dialogs, auth card
        pill: '999px',
      },
      boxShadow: {
        focus: '0 0 0 3px rgba(38, 68, 74, 0.35)',
      },
      backgroundColor: {
        overlay: 'rgba(2, 19, 22, 0.55)',
      },
      screens: {
        // Below this width the sidebar collapses into a top bar with a Menu button.
        nav: '900px',
      },
      width: {
        sidebar: '248px',
      },
    },
  },
  plugins: [],
};
