'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
  glitchProbability?: number; // 0-1, how often to glitch
  glitchDuration?: number; // ms
}

export default function GlitchText({ 
  text, 
  className = '', 
  glitchProbability = 0.005,
  glitchDuration = 150 
}: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(false);
  const [glitchedText, setGlitchedText] = useState(text);

  useEffect(() => {
    const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?0123456789';
    
    const checkGlitch = () => {
      if (Math.random() < glitchProbability && !isGlitching) {
        setIsGlitching(true);
        
        // Create glitched version
        const glitched = text.split('').map(char => {
          if (Math.random() < 0.3 && char !== ' ') {
            return glitchChars[Math.floor(Math.random() * glitchChars.length)];
          }
          return char;
        }).join('');
        
        setGlitchedText(glitched);
        
        // Reset after duration
        setTimeout(() => {
          setGlitchedText(text);
          setIsGlitching(false);
        }, glitchDuration);
      }
    };

    const interval = setInterval(checkGlitch, 100);
    return () => clearInterval(interval);
  }, [text, glitchProbability, glitchDuration, isGlitching]);

  return (
    <motion.span
      className={className}
      animate={{
        x: isGlitching ? [0, -1, 1, -1, 0] : 0,
        opacity: isGlitching ? [1, 0.8, 1, 0.9, 1] : 1,
      }}
      transition={{ duration: 0.1 }}
    >
      {glitchedText}
    </motion.span>
  );
}