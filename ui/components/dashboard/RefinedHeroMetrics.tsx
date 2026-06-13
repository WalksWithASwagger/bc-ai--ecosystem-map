'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  LightBulbIcon,
  GlobeAltIcon,
  TrophyIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'

interface MetricProps {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  description: string
  trend?: {
    value: string
    direction: 'up' | 'down' | 'neutral'
  }
}

const RefinedHeroMetrics: React.FC = () => {
  const metrics: MetricProps[] = [
    {
      label: 'Total Organizations',
      value: '1,450',
      icon: BuildingOfficeIcon,
      description: 'Companies in database',
      trend: { value: '+12%', direction: 'up' }
    },
    {
      label: 'AI Companies',
      value: '387',
      icon: LightBulbIcon,
      description: 'AI-focused organizations',
      trend: { value: '+18%', direction: 'up' }
    },
    {
      label: 'Total Funding',
      value: '$2.8B',
      icon: CurrencyDollarIcon,
      description: 'Aggregate funding raised',
      trend: { value: '+24%', direction: 'up' }
    },
    {
      label: 'Employment',
      value: '125K+',
      icon: UserGroupIcon,
      description: 'Total employees tracked',
      trend: { value: '+8%', direction: 'up' }
    },
    {
      label: 'Research Impact',
      value: '8.7/10',
      icon: ChartBarIcon,
      description: 'Global research ranking',
      trend: { value: '+0.3', direction: 'up' }
    },
    {
      label: 'Global Reach',
      value: '25',
      icon: GlobeAltIcon,
      description: 'Countries represented',
      trend: { value: '+3', direction: 'up' }
    },
    {
      label: 'Success Rate',
      value: '89%',
      icon: TrophyIcon,
      description: 'Portfolio company success',
      trend: { value: '+5%', direction: 'up' }
    },
    {
      label: 'Data Coverage',
      value: '94%',
      icon: PhotoIcon,
      description: 'Profile completeness',
      trend: { value: '+2%', direction: 'up' }
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
      }
    }
  }

  return (
    <section className="py-8">
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            variants={itemVariants}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300"
          >
            {/* Icon and Trend */}
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <metric.icon className="h-6 w-6 text-gray-700" />
              </div>
              {metric.trend && (
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  metric.trend.direction === 'up' 
                    ? 'bg-green-50 text-green-700' 
                    : metric.trend.direction === 'down'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-gray-50 text-gray-700'
                }`}>
                  <span>{metric.trend.value}</span>
                </div>
              )}
            </div>
            
            {/* Value */}
            <div className="mb-2">
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {metric.value}
              </h3>
              <p className="text-sm font-medium text-gray-700">
                {metric.label}
              </p>
            </div>
            
            {/* Description */}
            <p className="text-xs text-gray-500">
              {metric.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

export default RefinedHeroMetrics