'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Clock, GitCommit, Database, FileText, CheckCircle, AlertCircle, Zap } from 'lucide-react'

const activities = [
  {
    id: 1,
    type: 'enhancement',
    title: 'BetaKit funding data processed',
    description: 'AlayaCare enhanced with verified funding information',
    timestamp: '2 minutes ago',
    icon: Database,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10'
  },
  {
    id: 2,
    type: 'commit',
    title: 'Repository updated',
    description: 'All local research processed, verified data standards enforced',
    timestamp: '15 minutes ago',
    icon: GitCommit,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10'
  },
  {
    id: 3,
    type: 'processing',
    title: 'Batch import completed',
    description: '66 organizations enhanced with 169 field updates (78% success)',
    timestamp: '1 hour ago',
    icon: FileText,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10'
  },
  {
    id: 4,
    type: 'quality',
    title: 'Quality check passed',
    description: 'LinkedIn data verification: 0 low-confidence updates rejected',
    timestamp: '1 hour ago',
    icon: CheckCircle,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10'
  },
  {
    id: 5,
    type: 'milestone',
    title: 'Major milestone achieved',
    description: 'All 47 JSON research files successfully processed',
    timestamp: '3 hours ago',
    icon: Zap,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10'
  },
  {
    id: 6,
    type: 'enhancement',
    title: 'Database enhancement round',
    description: '308 companies enhanced with 1,232 field updates',
    timestamp: '6 hours ago',
    icon: Database,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10'
  }
]

const stats = {
  today: 12,
  thisWeek: 89,
  total: 425
}

export default function ActivityFeed() {
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-6"
      >
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          📋 Activity Feed
        </h3>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-4 h-4" />
          Real-time
        </div>
      </motion.div>

      {/* Activity Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-3 gap-2 mb-6"
      >
        <div className="text-center p-3 bg-slate-700/20 rounded-lg">
          <div className="text-lg font-bold text-white">{stats.today}</div>
          <div className="text-xs text-slate-400">Today</div>
        </div>
        <div className="text-center p-3 bg-slate-700/20 rounded-lg">
          <div className="text-lg font-bold text-white">{stats.thisWeek}</div>
          <div className="text-xs text-slate-400">This Week</div>
        </div>
        <div className="text-center p-3 bg-slate-700/20 rounded-lg">
          <div className="text-lg font-bold text-white">{stats.total}</div>
          <div className="text-xs text-slate-400">All Time</div>
        </div>
      </motion.div>

      {/* Activity List */}
      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
        {activities.map((activity, index) => {
          const Icon = activity.icon
          
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ 
                delay: index * 0.1 + 0.3, 
                duration: 0.3,
                ease: "easeOut"
              }}
              whileHover={{ scale: 1.02 }}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-700/20 transition-all duration-200 cursor-pointer group"
            >
              <div className={`flex-shrink-0 p-2 rounded-lg ${activity.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                <Icon className={`w-4 h-4 ${activity.color}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-white truncate group-hover:text-cyan-300 transition-colors">
                    {activity.title}
                  </h4>
                  <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                    {activity.timestamp}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {activity.description}
                </p>
              </div>

              {/* Pulse indicator for recent activities */}
              {index < 2 && (
                <motion.div
                  className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0 mt-2"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </motion.div>
          )
        })}
      </div>

      {/* View All Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full mt-4 py-2 px-4 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white text-sm font-medium rounded-lg transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50"
      >
        View Full Activity Log
      </motion.button>
    </div>
  )
}