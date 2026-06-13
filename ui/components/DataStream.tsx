'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface DataStreamProps {
  className?: string;
  color?: string;
  opacity?: number;
  speed?: number;
}

export default function DataStream({ 
  className = '', 
  color = 'neon-green',
  opacity = 0.1,
  speed = 3
}: DataStreamProps) {
  const [streamData, setStreamData] = useState<string[]>([]);

  useEffect(() => {
    // Generate random binary/hex data
    const generateData = () => {
      const types = ['binary', 'hex'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      if (type === 'binary') {
        return Array(8).fill(0).map(() => Math.round(Math.random())).join('');
      } else {
        return Array(4).fill(0).map(() => 
          Math.floor(Math.random() * 16).toString(16).toUpperCase()
        ).join('');
      }
    };

    // Initialize stream
    const initialData = Array(5).fill(0).map(() => generateData());
    setStreamData(initialData);

    // Update stream periodically
    const interval = setInterval(() => {
      setStreamData(prev => {
        const newData = [...prev];
        newData.shift();
        newData.push(generateData());
        return newData;
      });
    }, speed * 1000);

    return () => clearInterval(interval);
  }, [speed]);

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="absolute inset-0 flex flex-col justify-center items-start p-4 space-y-1">
        {streamData.map((data, index) => (
          <motion.div
            key={`${data}-${index}`}
            className={`text-${color} font-mono text-xs`}
            style={{ opacity: opacity * (1 - index * 0.15) }}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: opacity * (1 - index * 0.15) }}
            exit={{ x: 20, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {data}
          </motion.div>
        ))}
      </div>
    </div>
  );
}