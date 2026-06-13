'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadialBarChart, RadialBar, Legend } from 'recharts'

const processigRounds = [
  { round: 'Round 1', companies: 308, fields: 1232, confidence: 88, label: 'JSON Research' },
  { round: 'Round 2', companies: 66, fields: 169, confidence: 92, label: 'Batch Import' },
  { round: 'Round 3', companies: 1, fields: 4, confidence: 95, label: 'BetaKit Verified' },
]

const fieldCompleteness = [
  { field: 'Key People', before: 10, after: 85, improvement: 75 },
  { field: 'Funding', before: 25, after: 78, improvement: 53 },
  { field: 'AI Focus', before: 30, after: 82, improvement: 52 },
  { field: 'LinkedIn', before: 15, after: 68, improvement: 53 },
  { field: 'Employee Count', before: 20, after: 65, improvement: 45 },
  { field: 'Revenue', before: 5, after: 45, improvement: 40 },
]

const qualityMetrics = [
  { name: 'Verified Data', value: 95, color: '#10b981' },
  { name: 'Source Attribution', value: 100, color: '#3b82f6' },
  { name: 'Confidence Score', value: 92, color: '#8b5cf6' },
  { name: 'Completeness', value: 88, color: '#f59e0b' },
]

export default function ProgressVisualization() {
  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
      <motion.h3 
        className="text-2xl font-bold text-white mb-6 flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        📊 Progress Analytics
        <span className="text-sm font-normal text-slate-400 ml-auto">Real-time insights</span>
      </motion.h3>

      <div className="space-y-8">
        {/* Processing Rounds Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            🚀 Enhancement Rounds Performance
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={processigRounds}>
                <defs>
                  <linearGradient id="companiesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="fieldsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="round" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f9fafb'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="companies"
                  stroke="#06b6d4"
                  fillOpacity={1}
                  fill="url(#companiesGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Field Completeness Improvement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            📈 Field Completeness Improvement
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fieldCompleteness}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="field" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f9fafb'
                  }}
                />
                <Bar dataKey="before" fill="#6b7280" name="Before" />
                <Bar dataKey="after" fill="#10b981" name="After" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Quality Metrics Radial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            🎯 Data Quality Metrics
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="20%" outerRadius="80%" data={qualityMetrics}>
                <RadialBar
                  dataKey="value"
                  fill="#8884d8"
                />
                <Legend 
                  iconSize={10}
                  width={120}
                  height={140}
                  layout="vertical"
                  verticalAlign="middle"
                  wrapperStyle={{ color: '#f9fafb' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f9fafb'
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  )
}