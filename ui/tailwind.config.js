/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'mono': ['"Courier New"', 'monospace'],
        'terminal': ['"Courier New"', 'monospace'],
      },
      colors: {
        // Creative Intelligence Lab Cyberpunk Theme
        'cyber': {
          'bg': '#0a0a0a',           // Primary background
          'surface': '#111111',      // Surface color
          'surface-light': 'rgba(255, 255, 255, 0.05)',
          'surface-medium': 'rgba(255, 255, 255, 0.1)',
          'border': '#333333',       // Border color
        },
        'neon': {
          'green': '#00ff88',        // Primary neon green
          'blue': '#0099ff',         // Secondary neon blue  
          'pink': '#ff0099',         // Tertiary neon pink
        },
        'terminal': {
          'green': '#00ff88',        // Terminal green
          'blue': '#0099ff',         // Terminal blue
          'red': '#ff5f56',          // Terminal red
          'yellow': '#ffbd2e',       // Terminal yellow
          'white': '#e0e0e0',        // Primary text
          'gray': '#cccccc',         // Secondary text
          'muted': '#888888',        // Muted text
        },
        // Keep existing AI colors for compatibility
        'ai-dark': {
          50: '#0f172a',
          100: '#1e293b',  
          200: '#334155',
          300: '#475569',
          400: '#64748b',
          500: '#94a3b8',
        },
        'ai-electric': {
          400: '#00ff88',  // Changed to neon green
          500: '#0099ff',  // Changed to neon blue
          600: '#ff0099',  // Changed to neon pink
        },
        'ai-neon': {
          300: '#ff0099',
          400: '#00ff88',
          500: '#0099ff',
          600: '#ff0099',
        },
        'ai-emerald': {
          400: '#00ff88',
          500: '#00ff88',
          600: '#00ff88',
        },
        'ai-amber': {
          400: '#ffbd2e',
          500: '#ffbd2e',
          600: '#ffbd2e',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'cyber-grid': `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><pattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'><path d='M 10 0 L 0 0 0 10' fill='none' stroke='%23333' stroke-width='0.5'/></pattern></defs><rect width='100' height='100' fill='url(%23grid)'/></svg>")`,
        'cyber-hero': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        'cyber-surface': 'linear-gradient(145deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
        'neon-glow': 'linear-gradient(45deg, #00ff88, #0099ff)',
        'terminal-scan': 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.03) 2px, rgba(0,255,136,0.03) 4px)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'blink': 'blink 1s infinite',
        'glitch': 'glitch 2s infinite',
        'neon-pulse': 'neonPulse 2s ease-in-out infinite alternate',
        'terminal-cursor': 'terminalCursor 1s infinite',
        'scan-lines': 'scanLines 2s linear infinite',
        'gradient-x': 'gradientX 3s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(0, 255, 136, 0.5)' },
          '100%': { boxShadow: '0 0 30px rgba(0, 255, 136, 0.8)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
        neonPulse: {
          '0%': { 
            filter: 'drop-shadow(0 0 5px rgba(0, 255, 136, 0.5))',
            textShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
          },
          '100%': { 
            filter: 'drop-shadow(0 0 20px rgba(0, 255, 136, 0.8))',
            textShadow: '0 0 20px rgba(0, 255, 136, 0.8)',
          },
        },
        terminalCursor: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
        scanLines: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        gradientX: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'ai-glow': '0 0 20px rgba(0, 255, 136, 0.3)',
        'ai-card': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'ai-hover': '0 20px 40px rgba(0, 0, 0, 0.4)',
        'neon-green': '0 0 20px rgba(0, 255, 136, 0.5)',
        'neon-blue': '0 0 20px rgba(0, 153, 255, 0.5)',
        'neon-pink': '0 0 20px rgba(255, 0, 153, 0.5)',
        'terminal-glow': '0 0 30px rgba(0, 255, 136, 0.2)',
        'cyber-card': '0 10px 30px rgba(0, 255, 136, 0.2)',
        'cyber-hover': '0 15px 40px rgba(0, 255, 136, 0.4)',
      },
      dropShadow: {
        'neon-green': '0 0 10px rgba(0, 255, 136, 0.8)',
        'neon-blue': '0 0 10px rgba(0, 153, 255, 0.8)',
        'neon-pink': '0 0 10px rgba(255, 0, 153, 0.8)',
      }
    },
  },
  plugins: [],
}