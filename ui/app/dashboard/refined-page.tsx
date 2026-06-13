'use client'

import React from 'react'
import { motion } from 'framer-motion'
import RefinedHeroMetrics from '../../components/dashboard/RefinedHeroMetrics'
import RefinedDataVisualization from '../../components/dashboard/RefinedDataVisualization'
import RealNotionIntegration from '../../components/dashboard/RealNotionIntegration'
import ActivityFeed from '../../components/dashboard/ActivityFeed'

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
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
    }
  }
}

export default function RefinedDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Clean, professional layout */}
      <div className="relative">
        
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">BC AI Ecosystem Dashboard</h1>
                <p className="text-sm text-gray-600 mt-1">Strategic intelligence and ecosystem insights</p>
              </div>
              
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
        </header>

        {/* Main Content */}
        <main className="px-6 py-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Hero Metrics */}
            <motion.div variants={itemVariants}>
              <RefinedHeroMetrics />
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Data Visualization - Takes 2 columns */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <RefinedDataVisualization />
              </motion.div>

              {/* Activity Feed - Takes 1 column */}
              <motion.div variants={itemVariants}>
                <ActivityFeed />
              </motion.div>
            </div>

            {/* Real Notion Integration */}
            <motion.div variants={itemVariants}>
              <RealNotionIntegration />
            </motion.div>

            {/* Key Performance Indicators */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Ecosystem Health */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Ecosystem Health</h3>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Growth Rate</span>
                      <span className="font-medium text-green-600">+18% YoY</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Success Rate</span>
                      <span className="font-medium text-gray-900">89%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Diversity Index</span>
                      <span className="font-medium text-gray-900">8.7/10</span>
                    </div>
                  </div>
                </div>

                {/* Investment Climate */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Investment Climate</h3>
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Active VCs</span>
                      <span className="font-medium text-gray-900">24</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Avg Deal Size</span>
                      <span className="font-medium text-gray-900">$1.9M</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Deal Velocity</span>
                      <span className="font-medium text-green-600">+24%</span>
                    </div>
                  </div>
                </div>

                {/* Global Presence */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Global Presence</h3>
                    <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Countries</span>
                      <span className="font-medium text-gray-900">25</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Partnerships</span>
                      <span className="font-medium text-gray-900">156</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Export Growth</span>
                      <span className="font-medium text-green-600">+32%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

          </motion.div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-6 mt-12">
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
        </footer>
      </div>
    </div>
  )
}