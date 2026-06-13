/**
 * Category-specific color mapping for cyberpunk theme
 * Each category gets a unique neon color for visual distinction
 */

export const getCategoryColor = (category: string): {
  border: string;
  glow: string;
  text: string;
  bg: string;
  hex: string;
} => {
  const categoryColors: { [key: string]: any } = {
    'Start-ups & Scale-ups': {
      border: 'border-neon-green/20',
      glow: 'hover:border-neon-green/50 hover:shadow-neon-green/20',
      text: 'text-neon-green',
      bg: 'bg-neon-green/10',
      hex: '#00ff88'
    },
    'Academic & Research Labs': {
      border: 'border-neon-blue/20',
      glow: 'hover:border-neon-blue/50 hover:shadow-neon-blue/20',
      text: 'text-neon-blue',
      bg: 'bg-neon-blue/10',
      hex: '#0099ff'
    },
    'Enterprise / Corporate Divisions': {
      border: 'border-neon-pink/20',
      glow: 'hover:border-neon-pink/50 hover:shadow-neon-pink/20',
      text: 'text-neon-pink',
      bg: 'bg-neon-pink/10',
      hex: '#ff0099'
    },
    'Service Studios / Agencies': {
      border: 'border-terminal-yellow/20',
      glow: 'hover:border-terminal-yellow/50 hover:shadow-[0_0_20px_rgba(255,189,46,0.2)]',
      text: 'text-terminal-yellow',
      bg: 'bg-terminal-yellow/10',
      hex: '#ffbd2e'
    },
    'Government & Public Sector': {
      border: 'border-terminal-red/20',
      glow: 'hover:border-terminal-red/50 hover:shadow-[0_0_20px_rgba(255,95,86,0.2)]',
      text: 'text-terminal-red',
      bg: 'bg-terminal-red/10',
      hex: '#ff5f56'
    },
    'Investors & Funds': {
      border: 'border-cyan-400/20',
      glow: 'hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]',
      text: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
      hex: '#22d3ee'
    },
    'Non-Profit': {
      border: 'border-emerald-400/20',
      glow: 'hover:border-emerald-400/50 hover:shadow-[0_0_20px_rgba(52,211,153,0.2)]',
      text: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      hex: '#34d399'
    },
    'Grassroots Communities': {
      border: 'border-purple-400/20',
      glow: 'hover:border-purple-400/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]',
      text: 'text-purple-400',
      bg: 'bg-purple-400/10',
      hex: '#a855f7'
    },
    'Indigenous Tech & Creative Orgs': {
      border: 'border-orange-400/20',
      glow: 'hover:border-orange-400/50 hover:shadow-[0_0_20px_rgba(251,146,60,0.2)]',
      text: 'text-orange-400',
      bg: 'bg-orange-400/10',
      hex: '#fb923c'
    },
    'Industry Association': {
      border: 'border-indigo-400/20',
      glow: 'hover:border-indigo-400/50 hover:shadow-[0_0_20px_rgba(129,140,248,0.2)]',
      text: 'text-indigo-400',
      bg: 'bg-indigo-400/10',
      hex: '#818cf8'
    }
  };

  // Default color for unknown categories
  const defaultColor = {
    border: 'border-terminal-gray/20',
    glow: 'hover:border-terminal-gray/50 hover:shadow-[0_0_20px_rgba(156,163,175,0.2)]',
    text: 'text-terminal-gray',
    bg: 'bg-terminal-gray/10',
    hex: '#9ca3af'
  };

  return categoryColors[category] || defaultColor;
};

// Get a simpler color class for icons and small elements
export const getCategoryAccentColor = (category: string): string => {
  const colors = getCategoryColor(category);
  return colors.text;
};