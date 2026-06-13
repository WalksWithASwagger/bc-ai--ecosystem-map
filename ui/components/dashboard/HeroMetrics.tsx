'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Database, FileText, CheckCircle, Zap, Trophy } from 'lucide-react'

const metrics = [
  {
    label: 'Companies Enhanced',
    value: 375,
    icon: Database,
    color: 'from-cyan-400 to-blue-500',
    description: 'Total companies with enriched data'
  },
  {
    label: 'Field Updates',
    value: 1405,
    icon: TrendingUp,
    color: 'from-emerald-400 to-green-500',
    description: 'Individual data points added'
  },
  {
    label: 'Files Processed',
    value: 47,
    icon: FileText,
    color: 'from-purple-400 to-pink-500',
    description: 'Research files completely processed'
  },
  {
    label: 'Completion Rate',
    value: 100,
    icon: CheckCircle,
    color: 'from-orange-400 to-red-500',
    description: 'Local research utilization',
    suffix: '%'
  },
  {
    label: 'Quality Score',
    value: 95,
    icon: Trophy,
    color: 'from-yellow-400 to-orange-500',
    description: 'Data verification confidence',
    suffix: '%'
  },
  {
    label: 'Ready for Launch',
    value: 1,
    icon: Zap,
    color: 'from-pink-400 to-purple-500',
    description: 'Platform development ready',
    suffix: '🚀'
  }
]

interface AnimatedCounterProps {
  end: number
  duration?: number
  suffix?: string
}

function AnimatedCounter({ end, duration = 2, suffix = '' }: AnimatedCounterProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(end * easeOut))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration])

  return (
    <span className="tabular-nums">
      {count.toLocaleString()}{suffix}
    </span>
  )
}

export default function HeroMetrics() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        
        return (
          <motion.div
            key={metric.label}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: index * 0.1,
              duration: 0.5,
              ease: "easeOut"
            }}
            whileHover={{ 
              scale: 1.05,
              transition: { duration: 0.2 }
            }}
            className="relative group"
          >
            {/* Glow Effect */}
            <div className={`absolute inset-0 bg-gradient-to-r ${metric.color} rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300`} />
            
            {/* Card */}
            <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 h-full transition-all duration-300 group-hover:border-slate-600/50">
              {/* Icon */}
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${metric.color} mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>

              {/* Value */}
              <div className="mb-2">
                <motion.div 
                  className="text-3xl font-bold text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                >
                  <AnimatedCounter 
                    end={metric.value} 
                    duration={2 + index * 0.2}
                    suffix={metric.suffix}
                  />
                </motion.div>
                <motion.div 
                  className="text-sm font-semibold text-slate-300"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.7 }}
                >
                  {metric.label}
                </motion.div>
              </div>

              {/* Description */}
              <motion.p 
                className="text-xs text-slate-400 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.9 }}
              >
                {metric.description}
              </motion.p>

              {/* Sparkle Effect */}
              <motion.div
                className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full opacity-0"
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.5, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.3
                }}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}