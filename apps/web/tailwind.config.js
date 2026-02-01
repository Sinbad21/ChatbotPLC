const svgToDataUri = require("mini-svg-data-uri");
const { default: flattenColorPalette } = require("tailwindcss/lib/util/flattenColorPalette");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Legacy colors (kept for compatibility)
        primary: '#6366f1',
        secondary: '#8b5cf6',
        // Silver-Plated Theme Palette
        charcoal: '#0F172A',
        'off-white': '#F8FAFC',
        emerald: '#10B981',
        'muted-gray': '#94A3B8',
        // Premium Silver Colors
        'silver': {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E8E8E8',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        'pearl': {
          50: '#FAFBFC',
          100: '#F2F4F7',
          200: '#E4E9EF',
          300: '#D0D9E3',
          400: '#B4C0CF',
          500: '#94A3B8',
          600: '#64748B',
          700: '#475569',
          800: '#334155',
          900: '#1E293B',
        },
        'platinum': {
          50: '#FAFAFA',
          100: '#F4F4F5',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
          950: '#09090B',
        },
        'metallic': {
          light: '#E5E7EB',
          DEFAULT: '#9CA3AF',
          dark: '#6B7280',
        },
      },
      backgroundImage: {
        'silver-gradient': 'linear-gradient(135deg, #F8FAFC 0%, #E8E8E8 50%, #F5F5F5 100%)',
        'pearl-gradient': 'linear-gradient(135deg, #FAFBFC 0%, #E4E9EF 50%, #F2F4F7 100%)',
        'metallic-shine': 'linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.3) 55%, transparent 100%)',
        'silver-radial': 'radial-gradient(circle at 50% 0%, rgba(229, 231, 235, 0.4), transparent 70%)',
        'hero-gradient': 'linear-gradient(135deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.92) 50%, rgba(226, 232, 240, 0.90) 100%)',
      },
      boxShadow: {
        'silver': '0 4px 20px rgba(203, 213, 225, 0.3)',
        'silver-lg': '0 10px 40px rgba(203, 213, 225, 0.4)',
        'pearl': '0 4px 16px rgba(148, 163, 184, 0.15)',
        'metallic': '0 8px 32px rgba(100, 116, 139, 0.2)',
        'glow-silver': '0 0 20px rgba(226, 232, 240, 0.6)',
      },
      animation: {
        'shimmer': 'shimmer 2.5s linear infinite',
        'shine': 'shine 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        shine: {
          '0%, 100%': { backgroundPosition: '200% center' },
          '50%': { backgroundPosition: '-200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    addVariablesForColors,
    function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          "bg-grid": (value) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
            )}")`,
          }),
          "bg-grid-small": (value) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="8" height="8" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
            )}")`,
          }),
          "bg-dot": (value) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none"><circle fill="${value}" id="pattern-circle" cx="10" cy="10" r="1.6257413380501518"></circle></svg>`
            )}")`,
          }),
        },
        { values: flattenColorPalette(theme("backgroundColor")), type: "color" }
      );
    },
  ],
};

function addVariablesForColors({ addBase, theme }) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );
 
  addBase({
    ":root": newVars,
  });
}
