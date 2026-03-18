import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#4A2C2A', light: '#6D3B2E' },
        gold: { DEFAULT: '#C8860A', light: '#E8A020' },
      },
    },
  },
  plugins: [],
}
export default config
