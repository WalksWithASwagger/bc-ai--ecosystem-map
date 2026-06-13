'use client';

import { motion } from 'framer-motion';

interface ScanlineEffectProps {
  className?: string;
  opacity?: number;
  speed?: number; // seconds for one complete scan
}

export default function ScanlineEffect({ 
  className = '', 
  opacity = 0.03,
  speed = 8
}: ScanlineEffectProps) {
  return (
    <motion.div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Horizontal scanline */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-green to-transparent"
        style={{ 
          height: '2px',
          opacity,
          filter: 'blur(1px)',
          boxShadow: '0 0 10px rgba(0, 255, 136, 0.5)'
        }}
        animate={{
          y: ['-100%', '100vh'],
        }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Vertical scanline - slower and more subtle */}
      <motion.div
        className="absolute top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-neon-blue/30 to-transparent"
        style={{ 
          width: '1px',
          opacity: opacity * 0.5,
          filter: 'blur(1px)',
        }}
        animate={{
          x: ['-100%', '100vw'],
        }}
        transition={{
          duration: speed * 2,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </motion.div>
  );
}