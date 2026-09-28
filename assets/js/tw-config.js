/* Tailwind (Play CDN) settings shared by the studio pages. Preflight is off so it
   layers on top of studio.css without resetting it. */
tailwind.config = {
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        gold: { 50: '#fdf8ec', 100: '#f9ecc9', 200: '#f1d78f', 300: '#e2b760', 400: '#cf9b40', 500: '#b98631', 600: '#8f5f1d', 700: '#6f4715' },
        maroon: { 400: '#a13a20', 500: '#7a2412', 700: '#4a1409', 900: '#1f0a04' },
        cream: { 50: '#fffcf6', 100: '#fbf4e6', 200: '#f3e7cf' },
        ink: { DEFAULT: '#3a1a0a', soft: '#7a5634' },
      },
      fontFamily: {
        script: ['"Pinyon Script"', 'cursive'],
        serif: ['"Cormorant Garamond"', 'serif'],
        te: ['Suravaram', 'serif'],
        tedisplay: ['Ramaraja', 'serif'],
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(185,134,49,.35)',
        lift: '0 18px 40px -16px rgba(60,25,5,.45)',
      },
      transitionTimingFunction: { spring: 'cubic-bezier(.34,1.56,.64,1)', out: 'cubic-bezier(.16,1,.3,1)' },
    },
  },
};
