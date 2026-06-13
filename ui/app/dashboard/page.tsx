'use client'

import React from 'react'
import { motion } from 'framer-motion'
import RefinedHeroMetrics from '../../components/dashboard/RefinedHeroMetrics'
import RefinedDataVisualization from '../../components/dashboard/RefinedDataVisualization'
import RealNotionIntegration from '../../components/dashboard/RealNotionIntegration'
import ProgressVisualization from '../../components/dashboard/ProgressVisualization'
import ActivityFeed from '../../components/dashboard/ActivityFeed'
import NextSteps from '../../components/dashboard/NextSteps'
import UserCustomization from '../../components/dashboard/UserCustomization'

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
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]
      }
    }
  }

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <motion.div
        className="relative z-10 container mx-auto px-6 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <motion.h1 
            className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            🚀 BC AI Ecosystem Command Center
          </motion.h1>
          <motion.p 
            className="text-xl text-slate-300"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Your mission control for dominating the BC AI landscape
          </motion.p>
        </motion.div>

        {/* Enhanced Hero Metrics with Logos */}
        <motion.div variants={itemVariants} className="mb-8">
          <RefinedHeroMetrics />
        </motion.div>

        {/* Real Notion Database Integration */}
        <motion.div variants={itemVariants} className="mb-8">
          <RealNotionIntegration />
        </motion.div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {/* Progress Visualization */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <ProgressVisualization />
          </motion.div>

          {/* Leaderboards */}
          <motion.div variants={itemVariants}>
            {/* <Leaderboards /> */}
            <div className="text-center text-slate-400 p-8">
              Leaderboards component temporarily disabled
            </div>
          </motion.div>

          {/* Activity Feed */}
          <motion.div variants={itemVariants}>
            <ActivityFeed />
          </motion.div>

          {/* Next Steps */}
          <motion.div variants={itemVariants}>
            <NextSteps />
          </motion.div>

          {/* Documentation Browser */}
          <motion.div variants={itemVariants}>
            {/* <DocumentationBrowser /> */}
            <div className="text-center text-slate-400 p-8">
              Documentation Browser component temporarily disabled
            </div>
          </motion.div>
        </div>

        {/* Enhanced Analytics Section */}
        <motion.div variants={itemVariants} className="mb-8">
          {/* <AdvancedSearch 
            companies={[]} 
            onResultsChange={() => {}} 
            onCompanySelect={() => {}} 
          /> */}
          <div className="text-center text-slate-400 p-8">
            Advanced Search component temporarily disabled
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mb-8">
          <RefinedDataVisualization />
        </motion.div>

        <motion.div variants={itemVariants} className="mb-8">
          {/* <PerformanceMonitor /> */}
          <div className="text-center text-slate-400 p-8">
            Performance Monitor component temporarily disabled
          </div>
        </motion.div>

        {/* User Customization (Floating Button) */}
        <UserCustomization />

        {/* Footer Stats */}
        <motion.div 
          variants={itemVariants}
          className="text-center text-slate-400 text-sm"
        >
          <p>Last updated: {new Date().toLocaleString()} • Database Status: 🔥 LEGENDARY</p>
        </motion.div>
      </motion.div>
    </div>
  )
}