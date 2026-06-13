/**
 * CREATIVE INTELLIGENCE LAB DESIGN SYSTEM
 * Cyberpunk-aesthetic configuration for BC AI Ecosystem UI
 * 
 * Usage: Import this configuration to maintain consistency across components
 * Easy to modify: Update colors, fonts, or animations in one place
 */

export const DesignSystem = {
  // Color Palette
  colors: {
    primary: {
      background: '#0a0a0a',
      surface: '#111111',
      surface_light: 'rgba(255, 255, 255, 0.05)',
      surface_medium: 'rgba(255, 255, 255, 0.1)',
      border: '#333333'
    },
    accent: {
      primary_green: '#00ff88',
      secondary_blue: '#0099ff',
      tertiary_pink: '#ff0099',
      gradient_primary: 'linear-gradient(45deg, #00ff88, #0099ff)',
      gradient_hero: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      gradient_text: 'linear-gradient(45deg, #00ff88, #0099ff, #ff0099)'
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#cccccc',
      muted: '#888888',
      terminal_green: '#00ff88',
      terminal_blue: '#0099ff',
      error_red: '#ff5f56'
    }
  },

  // Typography System
  typography: {
    font_families: {
      primary: "'Courier New', monospace",
      fallback: 'monospace'
    },
    font_sizes: {
      hero_title: '4rem',
      section_title: '2.5rem',
      card_title: '1.5rem',
      body_large: '1.1rem',
      body: '1rem',
      small: '0.9rem'
    },
    font_weights: {
      normal: 'normal',
      bold: 'bold'
    },
    line_height: '1.6'
  },

  // Layout Grid System
  layout: {
    container: {
      max_width: '1200px',
      padding: '0 20px',
      margin: '0 auto'
    },
    sections: {
      padding_vertical: '100px',
      padding_mobile: '60px 0'
    },
    grid_systems: {
      process_grid: 'repeat(auto-fit, minmax(250px, 1fr))',
      artifact_grid: 'repeat(auto-fit, minmax(300px, 1fr))',
      stats_grid: 'repeat(auto-fit, minmax(200px, 1fr))',
      two_column: '1fr 1fr'
    },
    gaps: {
      small: '20px',
      medium: '30px',
      large: '40px',
      xl: '50px'
    }
  },

  // Component Styling
  components: {
    cards: {
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid #333',
      border_radius: '10px',
      padding: '30px',
      hover_transform: 'translateY(-5px)',
      hover_border: '#00ff88',
      hover_shadow: '0 10px 30px rgba(0, 255, 136, 0.2)',
      transition: 'all 0.3s'
    },
    buttons: {
      primary: {
        background: 'linear-gradient(45deg, #00ff88, #0099ff)',
        color: '#000',
        padding: '15px 30px',
        border_radius: '5px',
        font_weight: 'bold',
        hover_transform: 'scale(1.05)',
        transition: 'transform 0.3s'
      }
    },
    terminal: {
      background: '#000',
      border: '1px solid #333',
      border_radius: '10px',
      padding: '20px',
      font_family: "'Courier New', monospace",
      dots: {
        red: '#ff5f56',
        yellow: '#ffbd2e',
        green: '#27ca3f'
      }
    }
  },

  // Animation Library
  animations: {
    keyframes: {
      glow: {
        from: 'filter: drop-shadow(0 0 5px rgba(0, 255, 136, 0.5))',
        to: 'filter: drop-shadow(0 0 20px rgba(0, 255, 136, 0.8))'
      },
      blink: {
        '0%, 50%': 'opacity: 1',
        '51%, 100%': 'opacity: 0'
      },
      pulse: {
        '0%, 100%': 'opacity: 0.5',
        '50%': 'opacity: 1'
      },
      glitch: {
        '0%': 'transform: translate(0)',
        '20%': 'transform: translate(-2px, 2px)',
        '40%': 'transform: translate(-2px, -2px)',
        '60%': 'transform: translate(2px, 2px)',
        '80%': 'transform: translate(2px, -2px)',
        '100%': 'transform: translate(0)'
      }
    },
    durations: {
      fast: '0.3s',
      medium: '1s',
      slow: '2s'
    },
    timing: 'ease-in-out infinite alternate'
  },

  // Interactive Effects
  interactions: {
    hover_effects: {
      cards: {
        transform: 'translateY(-5px) scale(1.02)',
        border_glow: '#00ff88',
        shadow: '0 10px 30px rgba(0, 255, 136, 0.2)'
      },
      buttons: {
        transform: 'scale(1.05)',
        timing: '0.3s ease'
      }
    },
    active_states: {
      process_cards: {
        background: 'rgba(0, 255, 136, 0.1)',
        border: '#00ff88'
      }
    }
  },

  // Background Patterns
  backgrounds: {
    grid_pattern: {
      svg: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><pattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'><path d='M 10 0 L 0 0 0 10' fill='none' stroke='%23333' stroke-width='0.5'/></pattern></defs><rect width='100' height='100' fill='url(%23grid)'/></svg>",
      opacity: '0.3'
    },
    gradients: {
      hero: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
      section_alt: '#111111'
    }
  },

  // Responsive Breakpoints
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1200px',
    mobile_adjustments: {
      hero_title: '2.5rem',
      nav_links: 'display: none',
      grid_columns: '1fr',
      section_padding: '60px 0'
    }
  }
};

// Utility functions for easy access
export const getColor = (path) => {
  const keys = path.split('.');
  return keys.reduce((obj, key) => obj?.[key], DesignSystem.colors);
};

export const getTypography = (path) => {
  const keys = path.split('.');
  return keys.reduce((obj, key) => obj?.[key], DesignSystem.typography);
};

export const getAnimation = (name) => {
  return DesignSystem.animations.keyframes[name];
};

// CSS Custom Properties Generator
export const generateCSSVariables = () => {
  const flatten = (obj, prefix = '') => {
    let result = {};
    for (const key in obj) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}-${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(result, flatten(value, newKey));
      } else {
        result[`--${newKey}`] = value;
      }
    }
    return result;
  };
  
  return flatten(DesignSystem);
};

export default DesignSystem;