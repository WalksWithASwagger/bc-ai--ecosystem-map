'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Rocket, Users, Zap, Target, Globe, TrendingUp } from 'lucide-react'

const nextSteps = [
  {
    id: 1,
    title: 'Platform Development',
    description: 'Build public-facing ecosystem map with interactive features',
    priority: 'High',
    effort: '3-4 weeks',
    icon: Rocket,
    color: 'from-cyan-400 to-blue-500',
    status: 'ready'
  },
  {
    id: 2,
    title: 'Stakeholder Engagement',
    description: 'Launch community outreach and partnerships program',
    priority: 'High',
    effort: '2-3 weeks',
    icon: Users,
    color: 'from-emerald-400 to-green-500',
    status: 'planned'
  },
  {
    id: 3,
    title: 'Real-time Data Feeds',
    description: 'Implement automated data gathering from external sources',
    priority: 'Medium',
    effort: '4-6 weeks',
    icon: Zap,
    color: 'from-purple-400 to-pink-500',
    status: 'planned'
  },
  {
    id: 4,
    title: 'AI-Powered Insights',
    description: 'Add intelligent analysis and trend prediction features',
    priority: 'Medium',
    effort: '6-8 weeks',
    icon: Target,
    color: 'from-orange-400 to-red-500',
    status: 'planned'
  }
]

const milestones = [
  { title: 'Q1 2025: Public Launch', progress: 85, description: 'Platform MVP ready' },
  { title: 'Q2 2025: 1,000 MAU', progress: 25, description: 'User acquisition focus' },
  { title: 'Q3 2025: API Launch', progress: 15, description: 'Developer ecosystem' },
  { title: 'Q4 2025: Enterprise', progress: 5, description: 'B2B features & sales' },
]

export default function NextSteps() {
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
      <motion.h3 
        className="text-xl font-bold text-white mb-6 flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        🎯 Next Steps
        <span className="text-sm font-normal text-slate-400 ml-auto">Strategic roadmap</span>
      </motion.h3>

      <div className="space-y-6">
        {/* Immediate Next Steps */}
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            Immediate Actions
          </h4>
          <div className="space-y-3">
            {nextSteps.map((step, index) => {
              const Icon = step.icon
              
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                  className={`relative p-4 rounded-lg border transition-all duration-200 cursor-pointer group ${
                    step.status === 'ready' 
                      ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30 hover:border-emerald-400/50' 
                      : 'bg-slate-700/20 border-slate-600/30 hover:border-slate-500/50'
                  }`}
                >
                  {/* Glow effect for ready items */}
                  {step.status === 'ready' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                  
                  <div className="relative flex items-start gap-3">
                    <div className={`flex-shrink-0 p-2 rounded-lg bg-gradient-to-r ${step.color}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                          {step.title}
                        </h5>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            step.priority === 'High' 
                              ? 'bg-red-500/20 text-red-300' 
                              : 'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {step.priority}
                          </span>
                          {step.status === 'ready' && (
                            <motion.div
                              className="w-2 h-2 bg-emerald-400 rounded-full"
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
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">
                        {step.description}
                      </p>
                      <p className="text-xs text-slate-500">
                        Effort: {step.effort}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Milestone Progress */}
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            2025 Milestones
          </h4>
          <div className="space-y-3">
            {milestones.map((milestone, index) => (
              <motion.div
                key={milestone.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 + 0.4, duration: 0.3 }}
                className="p-3 bg-slate-700/20 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    {milestone.title}
                  </span>
                  <span className="text-xs text-slate-400">
                    {milestone.progress}%
                  </span>
                </div>
                
                <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                  <motion.div
                    className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${milestone.progress}%` }}
                    transition={{ delay: index * 0.1 + 0.6, duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                
                <p className="text-xs text-slate-400">
                  {milestone.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Action Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group"
        >
          <Rocket className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
          Start Platform Development
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </motion.button>
      </div>
    </div>
  )
}