'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChartBarIcon, 
  BuildingOfficeIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
  ArrowTrendingUpIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'

interface DashboardMetric {
  label: string
  value: string | number
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
}

interface Organization {
  id: string
  name: string
  category: string
  location: string
  employees: string
  funding: string
  logo?: string
}

const RefinedDashboard: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  
  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])
  
  const metrics: DashboardMetric[] = [
    {
      label: 'Total Organizations',
      value: '1,450',
      change: '+12%',
      trend: 'up',
      icon: BuildingOfficeIcon
    },
    {
      label: 'AI Companies',
      value: '387',
      change: '+18%', 
      trend: 'up',
      icon: LightBulbIcon
    },
    {
      label: 'Total Funding',
      value: '$2.8B',
      change: '+24%',
      trend: 'up', 
      icon: CurrencyDollarIcon
    },
    {
      label: 'Employment',
      value: '125K+',
      change: '+8%',
      trend: 'up',
      icon: UserGroupIcon
    }
  ]
  
  const recentOrganizations: Organization[] = [
    {
      id: '1',
      name: 'MistyWest',
      category: 'Electronic Design',
      location: 'Vancouver, BC',
      employees: '25-50',
      funding: '$5-10M ARR'
    },
    {
      id: '2', 
      name: 'Circles of AI',
      category: 'AI Education',
      location: 'Vancouver, BC',
      employees: '10-15',
      funding: 'Community-driven'
    },
    {
      id: '3',
      name: 'Get Fresh Ventures', 
      category: 'Venture Capital',
      location: 'Vancouver, BC',
      employees: '8-12',
      funding: 'VC Fund'
    }
  ]
  
  const quickActions = [
    { 
      label: 'Add Organization', 
      icon: BuildingOfficeIcon,
      href: '/dashboard/add-organization'
    },
    { 
      label: 'Generate Report', 
      icon: ChartBarIcon,
      href: '/dashboard/reports'
    },
    { 
      label: 'Export Data', 
      icon: ArrowTrendingUpIcon,
      href: '/dashboard/export'
    },
    { 
      label: 'Settings', 
      icon: Cog6ToothIcon,
      href: '/dashboard/settings'
    }
  ]
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">Loading dashboard...</p>
        </motion.div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">BC AI Ecosystem</h1>
              <p className="text-sm text-gray-600 mt-1">Strategic intelligence dashboard</p>
            </div>
            
            {/* Search */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-80"
                />
              </div>
              
              {/* Time Range Selector */}
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="px-6 py-6">
        {/* Key Metrics */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{metric.value}</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <metric.icon className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  metric.trend === 'up' ? 'text-green-600' : 
                  metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {metric.change}
                </span>
                <span className="text-sm text-gray-600 ml-2">from last period</span>
              </div>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Organizations */}
          <motion.div 
            className="lg:col-span-2 bg-white rounded-lg border border-gray-200"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Organizations</h2>
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                  View all
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {recentOrganizations.map((org, index) => (
                <motion.div
                  key={org.id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {org.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{org.name}</h3>
                        <p className="text-sm text-gray-600">{org.category}</p>
                        <p className="text-xs text-gray-500">{org.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{org.employees} employees</p>
                      <p className="text-xs text-gray-600">{org.funding}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          {/* Quick Actions */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            {/* Quick Actions Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={action.label}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  >
                    <div className="flex items-center space-x-3">
                      <action.icon className="h-5 w-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900">{action.label}</span>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Ecosystem Overview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ecosystem Overview</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <GlobeAltIcon className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm text-gray-600">Global Reach</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">25 countries</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AcademicCapIcon className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm text-gray-600">Research Institutions</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">8 universities</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CurrencyDollarIcon className="h-4 w-4 text-indigo-600" />
                    <span className="text-sm text-gray-600">Average Funding</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">$1.9M</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default RefinedDashboard