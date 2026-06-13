'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface LogoDisplayProps {
  company: {
    id: string
    name: string
    logo?: string | null
    category?: string
    funding?: string
    size?: string
  }
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showFallback?: boolean
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
}

const fallbackColors = [
  'bg-gradient-to-br from-blue-500 to-cyan-500',
  'bg-gradient-to-br from-emerald-500 to-green-500',
  'bg-gradient-to-br from-purple-500 to-pink-500',
  'bg-gradient-to-br from-orange-500 to-red-500',
  'bg-gradient-to-br from-yellow-500 to-orange-500',
  'bg-gradient-to-br from-indigo-500 to-purple-500'
]

export default function LogoDisplay({ 
  company, 
  size = 'md', 
  className = '',
  showFallback = true 
}: LogoDisplayProps) {
  // Generate initials from company name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 3)
      .toUpperCase()
  }

  // Get consistent color based on company name
  const getFallbackColor = (name: string) => {
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return fallbackColors[hash % fallbackColors.length]
  }

  const initials = getInitials(company.name)
  const fallbackColor = getFallbackColor(company.name)
  const sizeClass = sizeClasses[size]

  // If we have a logo URL, display it
  if (company.logo) {
    return (
      <motion.div
        className={`${sizeClass} relative overflow-hidden rounded-lg bg-white shadow-sm border border-slate-200 ${className}`}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <img
          src={company.logo}
          alt={`${company.name} logo`}
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full ${fallbackColor} rounded-lg flex items-center justify-center">
                  <span class="text-white font-bold text-sm">${initials}</span>
                </div>
              `
            }
          }}
        />
      </motion.div>
    )
  }

  // Fallback to initials with gradient background
  if (showFallback) {
    return (
      <motion.div
        className={`${sizeClass} ${fallbackColor} rounded-lg flex items-center justify-center shadow-sm ${className}`}
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
      >
        <span className={`text-white font-bold ${
          size === 'sm' ? 'text-xs' : 
          size === 'md' ? 'text-sm' :
          size === 'lg' ? 'text-base' : 'text-xl'
        }`}>
          {initials}
        </span>
      </motion.div>
    )
  }

  // No logo and no fallback
  return (
    <div className={`${sizeClass} bg-slate-100 rounded-lg ${className}`} />
  )
}