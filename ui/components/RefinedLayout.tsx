'use client'

import React from 'react'
import { motion } from 'framer-motion'
import RefinedNavigation from './RefinedNavigation'

interface RefinedLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  showNavigation?: boolean
}

const RefinedLayout: React.FC<RefinedLayoutProps> = ({ 
  children, 
  title = "BC AI Ecosystem",
  subtitle = "Strategic Intelligence Dashboard",
  showNavigation = true
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      {showNavigation && <RefinedNavigation />}
      
      {/* Main Content Area */}
      <div className={showNavigation ? "md:ml-64" : ""}>
        {/* Page Header */}
        <motion.header 
          className="bg-white border-b border-gray-200 sticky top-0 z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                )}
              </div>
              
              {/* Header Actions */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Live Data</span>
                </div>
                <div className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </motion.header>
        
        {/* Page Content */}
        <motion.main 
          className="px-6 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {children}
        </motion.main>
        
        {/* Footer */}
        <motion.footer 
          className="bg-white border-t border-gray-200 py-6 mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="px-6">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <p>© 2025 BC AI Ecosystem Dashboard. All rights reserved.</p>
              <div className="flex items-center space-x-4">
                <span>Data refreshed every 15 minutes</span>
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              </div>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  )
}

export default RefinedLayout