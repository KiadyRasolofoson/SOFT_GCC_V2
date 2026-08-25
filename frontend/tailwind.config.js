/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Source Serif 4', 'ui-serif', 'Georgia', 'Times New Roman', 'serif'],
      },
      colors: {
        navy: '#0f172a',
        'indigo-pro': '#1e3a8a',
        accent: '#6366f1',
        'accent-violet': '#7c3aed',
        canvas: '#f8fafc',
        'skill-beginner-bg': '#e0f2fe',
        'skill-beginner-fg': '#0369a1',
        'skill-mid-bg': '#d1fae5',
        'skill-mid-fg': '#047857',
        'skill-expert-bg': '#ede9fe',
        'skill-expert-fg': '#6d28d9',
        'gap-bg': '#fef3c7',
        'gap-fg': '#b45309',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        '2xs': '0 1px rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
};
