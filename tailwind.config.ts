import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        pitch: '#1e2a1f',
        seam: '#c93b3b'
      },
      boxShadow: {
        panel: '0 20px 50px rgba(15, 23, 42, 0.45)'
      }
    }
  },
  plugins: []
};

export default config;
