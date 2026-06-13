'use client';

import { motion } from 'framer-motion';
import { Moon, Sun, Zap, Palette } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        relative group flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm
        transition-all duration-300 hover:scale-105
        ${theme === 'dark' 
          ? 'bg-black/30 border border-cyan-500/30 text-cyan-300 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-400/20' 
          : 'bg-white/70 border border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-200/50'
        }
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 0 : 180 }}
        transition={{ duration: 0.3 }}
      >
        {theme === 'dark' ? (
          <Zap className="w-4 h-4 text-cyan-400" />
        ) : (
          <Palette className="w-4 h-4 text-blue-600" />
        )}
      </motion.div>
      
      <span className="hidden sm:inline">
        {theme === 'dark' ? 'Aurora Borealis' : 'Zen Mode'}
      </span>
      
      {/* Aurora effect for dark mode */}
      {theme === 'dark' && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      )}
    </motion.button>
  );
}