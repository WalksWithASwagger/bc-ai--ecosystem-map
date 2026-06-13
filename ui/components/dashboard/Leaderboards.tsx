'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Award, TrendingUp, Star } from 'lucide-react'

const topCompanies = [
  { name: 'Clio', updates: 12, rank: 1, growth: '+340%' },
  { name: 'D-Wave Systems', updates: 11, rank: 2, growth: '+280%' },
  { name: 'Sanctuary AI', updates: 10, rank: 3, growth: '+250%' },
  { name: 'AbCellera', updates: 9, rank: 4, growth: '+180%' },
  { name: 'Terramera', updates: 8, rank: 5, growth: '+160%' },
]

const processingChampions = [
  { round: 'JSON Research Round', companies: 308, fields: 1232, efficiency: 97 },
  { round: 'Batch Import Round', companies: 66, fields: 169, efficiency: 78 },
  { round: 'BetaKit Verification', companies: 1, fields: 4, efficiency: 95 },
]

const achievements = [
  { title: 'Database Completionist', description: '1,405+ field updates', icon: Trophy, unlocked: true },
  { title: 'Quality Champion', description: '95%+ confidence maintained', icon: Medal, unlocked: true },
  { title: 'Processing Pioneer', description: '47 files processed', icon: Award, unlocked: true },
  { title: 'Platform Ready', description: 'Ready for launch', icon: Star, unlocked: true },
]

export default function Leaderboards() {
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
      <motion.h3 
        className="text-xl font-bold text-white mb-6 flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        🏆 Leaderboards
      </motion.h3>

      <div className="space-y-6">
        {/* Top Enhanced Companies */}
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Most Enhanced Companies
          </h4>
          <div className="space-y-2">
            {topCompanies.map((company, index) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  {index === 0 && <Trophy className="w-5 h-5 text-yellow-400" />}
                  {index === 1 && <Medal className="w-5 h-5 text-gray-300" />}
                  {index === 2 && <Award className="w-5 h-5 text-amber-600" />}
                  {index > 2 && <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-slate-400">#{index + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{company.name}</p>
                  <p className="text-xs text-slate-400">{company.updates} field updates</p>
                </div>
                <div className="text-xs font-medium text-emerald-400">
                  {company.growth}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Processing Champions */}
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-3">
            🚀 Processing Champions
          </h4>
          <div className="space-y-2">
            {processingChampions.map((round, index) => (
              <motion.div
                key={round.round}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.3 }}
                className="p-3 bg-gradient-to-r from-slate-700/20 to-slate-600/20 rounded-lg border border-slate-600/30"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-white">{round.round}</p>
                  <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                    {round.efficiency}% efficiency
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {round.companies} companies • {round.fields} fields
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <h4 className="text-sm font-semibold text-slate-300 mb-3">
            🎖️ Achievements Unlocked
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon
              return (
                <motion.div
                  key={achievement.title}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: index * 0.1 + 0.5, 
                    duration: 0.3,
                    type: "spring" as const,
                    stiffness: 200
                  }}
                  className={`p-3 rounded-lg border text-center ${
                    achievement.unlocked 
                      ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30' 
                      : 'bg-slate-700/20 border-slate-600/30'
                  }`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-1 ${
                    achievement.unlocked ? 'text-yellow-400' : 'text-slate-500'
                  }`} />
                  <p className={`text-xs font-medium ${
                    achievement.unlocked ? 'text-yellow-200' : 'text-slate-400'
                  }`}>
                    {achievement.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {achievement.description}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}