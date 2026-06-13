// Comprehensive Design System for BC AI Ecosystem
// Aurora Borealis Dark Mode + Japanese Minimalist Light Mode

export type Theme = 'dark' | 'light';

export const themes = {
  dark: {
    // Aurora Borealis Dark Theme
    name: 'Aurora Borealis',
    background: {
      primary: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
      secondary: 'bg-black/50 backdrop-blur-sm',
      tertiary: 'bg-black/30 backdrop-blur-md',
      card: 'bg-gradient-to-br from-slate-800/50 to-purple-900/30 backdrop-blur-lg',
      glass: 'bg-white/5 backdrop-blur-xl border border-white/10',
    },
    text: {
      primary: 'text-white',
      secondary: 'text-slate-300',
      accent: 'text-cyan-300',
      muted: 'text-slate-400',
    },
    aurora: {
      // Aurora Borealis color palette
      cyan: '#00f5ff',      // Electric cyan
      green: '#39ff14',     // Electric green  
      purple: '#bf00ff',    // Electric purple
      pink: '#ff073a',      // Electric pink
      yellow: '#ffff00',    // Electric yellow
      blue: '#0080ff',      // Electric blue
      teal: '#00ffff',      // Electric teal
      magenta: '#ff1493',   // Electric magenta
    },
    gradients: {
      aurora: 'bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500',
      northern: 'bg-gradient-to-br from-green-400 via-blue-500 to-purple-600',
      bioluminescent: 'bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500',
    },
    borders: {
      primary: 'border-cyan-500/30',
      secondary: 'border-purple-500/30',
      accent: 'border-pink-500/30',
      glow: 'border-cyan-400/50 shadow-lg shadow-cyan-400/20',
    },
    animations: {
      glow: 'animate-pulse',
      aurora: 'animate-gradient-x',
      float: 'animate-bounce',
      shimmer: 'animate-shimmer',
    }
  },
  light: {
    // Japanese Minimalist Light Theme
    name: 'Japanese Minimalist',
    background: {
      primary: 'bg-gradient-to-br from-slate-50 to-white',
      secondary: 'bg-white/80 backdrop-blur-sm',
      tertiary: 'bg-gray-50/50 backdrop-blur-md',
      card: 'bg-white/90 backdrop-blur-lg shadow-lg shadow-gray-200/50',
      glass: 'bg-white/70 backdrop-blur-xl border border-gray-200/50',
    },
    text: {
      primary: 'text-gray-900',
      secondary: 'text-gray-700',
      accent: 'text-blue-600',
      muted: 'text-gray-500',
    },
    zen: {
      // Japanese minimalist palette
      charcoal: '#2d3748',    // Sumi ink
      stone: '#4a5568',       // Stone gray
      bamboo: '#68d391',      // Bamboo green
      cherry: '#f56565',      // Cherry blossom
      sky: '#4299e1',         // Sky blue
      paper: '#f7fafc',       // Paper white
      ink: '#1a202c',         // Calligraphy ink
      gold: '#d69e2e',        // Gold accent
    },
    gradients: {
      zen: 'bg-gradient-to-r from-gray-100 to-white',
      minimal: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      elegant: 'bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50',
    },
    borders: {
      primary: 'border-gray-200',
      secondary: 'border-blue-200',
      accent: 'border-indigo-200',
      elegant: 'border-gray-300/50 shadow-sm',
    },
    animations: {
      subtle: 'hover:scale-105 transition-transform duration-300',
      elegant: 'hover:shadow-lg transition-shadow duration-300',
      zen: 'hover:bg-gray-50 transition-colors duration-200',
    }
  }
};

export const chartThemes = {
  dark: {
    background: 'transparent',
    grid: '#374151',
    text: '#e5e7eb',
    colors: [
      '#00f5ff', '#39ff14', '#bf00ff', '#ff073a', 
      '#ffff00', '#0080ff', '#00ffff', '#ff1493'
    ],
    tooltip: {
      background: '#1f2937',
      border: '#374151',
      text: '#e5e7eb'
    }
  },
  light: {
    background: '#ffffff',
    grid: '#e5e7eb',
    text: '#374151',
    colors: [
      '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b',
      '#ef4444', '#06b6d4', '#84cc16', '#ec4899'
    ],
    tooltip: {
      background: '#ffffff',
      border: '#e5e7eb',
      text: '#374151'
    }
  }
};

export const getThemeClasses = (theme: Theme) => themes[theme];
export const getChartTheme = (theme: Theme) => chartThemes[theme];