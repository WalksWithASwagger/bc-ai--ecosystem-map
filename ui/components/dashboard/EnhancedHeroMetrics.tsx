'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Database, FileText, CheckCircle, Zap, Trophy, Image } from 'lucide-react'
import LogoDisplay from '../LogoDisplay'
import { getRealFeaturedCompanies } from '../../lib/real-notion-api'

const metrics = [
  {
    label: 'Companies Enhanced',
    value: 375,
    icon: Database,
    color: 'from-cyan-400 to-blue-500',
    description: 'Total companies with enriched data'
  },
  {
    label: 'Logos Collected',
    value: 20,
    icon: Image,
    color: 'from-pink-400 to-purple-500',
    description: 'Successfully uploaded to Notion',
    isNew: true
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
    label: 'Visual Coverage',
    value: 3,
    icon: Trophy,
    color: 'from-yellow-400 to-orange-500',
    description: 'Real logos in Notion DB',
    suffix: '%'
  },
  {
    label: 'Ready for Launch',
    value: 1,
    icon: Zap,
    color: 'from-orange-400 to-red-500',
    description: 'Platform development ready',
    suffix: '🚀'
  }
]

// REAL companies with logos now in Notion database - 20 uploaded successfully!
const realFeaturedCompanies = [
  { id: '1', name: 'Clio', logo: 'https://bc-ai-ecosystem.vercel.app/logos/Clio_logo.png', category: 'Legal Tech' },
  { id: '2', name: 'D-Wave Systems', logo: 'https://bc-ai-ecosystem.vercel.app/logos/D_Wave_Systems_logo.png', category: 'Quantum Computing' },
  { id: '3', name: 'Sanctuary AI', logo: 'https://bc-ai-ecosystem.vercel.app/logos/Sanctuary_AI_logo.png', category: 'Robotics' },
  { id: '4', name: 'AbCellera', logo: 'https://bc-ai-ecosystem.vercel.app/logos/AbCellera_logo.svg', category: 'Biotech' },
  { id: '5', name: 'Hootsuite', logo: 'https://bc-ai-ecosystem.vercel.app/logos/Hootsuite_logo_clearbit.png', category: 'Social Media' },
  { id: '6', name: 'Terramera', logo: 'https://bc-ai-ecosystem.vercel.app/logos/Terramera_logo.png', category: 'AgTech' }
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

export default function EnhancedHeroMetrics() {
  return (
    <div className="space-y-6">
      {/* Main Metrics Grid */}
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
              {/* New Badge */}
              {metric.isNew && (
                <motion.div
                  className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  NEW
                </motion.div>
              )}

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

      {/* Featured Companies Showcase */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            🏆 Featured Companies
            <span className="text-sm font-normal text-slate-400">with logos</span>
          </h3>
          <motion.span 
            className="text-xs px-3 py-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 rounded-full border border-pink-500/30"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            Visual Ready
          </motion.span>
        </div>
        
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          {realFeaturedCompanies.map((company, index) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + index * 0.1, duration: 0.3 }}
              className="flex-shrink-0 group"
            >
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-700/30 transition-colors duration-200">
                <LogoDisplay 
                  company={company}
                  size="lg"
                  className="group-hover:shadow-lg transition-shadow duration-200"
                />
                <div className="text-center">
                  <div className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                    {company.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {company.category}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* View All Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-xl border-2 border-dashed border-slate-600 text-slate-400 hover:border-cyan-500 hover:text-cyan-300 transition-all duration-200 group"
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform duration-200">+</div>
            <div className="text-xs">View All</div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}