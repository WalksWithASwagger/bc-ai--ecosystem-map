'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FileText, FolderOpen, ExternalLink, BookOpen, Star, Clock } from 'lucide-react'

const documentCategories = [
  {
    name: 'Project Reports',
    count: 12,
    icon: FileText,
    color: 'text-cyan-400',
    docs: [
      { title: 'Comprehensive Data Processing Complete', type: 'report', starred: true },
      { title: 'Final Company Data Processing Summary', type: 'report', starred: true },
      { title: 'BetaKit Funding Processing Results', type: 'report', starred: false },
      { title: 'Database Enhancement Pipeline Results', type: 'report', starred: false },
    ]
  },
  {
    name: 'Strategic Plans',
    count: 8,
    icon: BookOpen,
    color: 'text-emerald-400',
    docs: [
      { title: 'Verified Data Gathering Plan', type: 'plan', starred: true },
      { title: 'Project Dashboard Plan', type: 'plan', starred: true },
      { title: 'Strategic Next Steps Plan', type: 'plan', starred: false },
      { title: 'UI Development Roadmap', type: 'plan', starred: false },
    ]
  },
  {
    name: 'Technical Docs',
    count: 6,
    icon: FolderOpen,
    color: 'text-purple-400',
    docs: [
      { title: 'Database Schema Documentation', type: 'technical', starred: true },
      { title: 'Processing Tools Guide', type: 'technical', starred: false },
      { title: 'Enhancement Integration Strategy', type: 'technical', starred: false },
      { title: 'Quality Standards Guide', type: 'technical', starred: false },
    ]
  }
]

const recentDocs = [
  { title: 'Comprehensive Data Processing Complete', time: '2 mins ago', type: 'report' },
  { title: 'Verified Data Gathering Plan', time: '15 mins ago', type: 'plan' },
  { title: 'BetaKit Funding Processing Results', time: '1 hour ago', type: 'report' },
  { title: 'Database Enhancement Pipeline', time: '3 hours ago', type: 'technical' },
]

export default function DocumentationBrowser() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
      <motion.h3 
        className="text-xl font-bold text-white mb-6 flex items-center gap-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        📚 Documentation
        <span className="text-sm font-normal text-slate-400 ml-auto">Smart browser</span>
      </motion.h3>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="relative mb-6"
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-200"
        />
      </motion.div>

      {/* Recent Documents */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recently Viewed
        </h4>
        <div className="space-y-2">
          {recentDocs.map((doc, index) => (
            <motion.div
              key={doc.title}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 + 0.3, duration: 0.2 }}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/30 transition-all duration-200 cursor-pointer group"
            >
              <FileText className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate group-hover:text-cyan-300 transition-colors">
                  {doc.title}
                </p>
                <p className="text-xs text-slate-500">{doc.time}</p>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Document Categories */}
      <div>
        <h4 className="text-sm font-semibold text-slate-300 mb-3">
          📁 Browse by Category
        </h4>
        <div className="space-y-2">
          {documentCategories.map((category, index) => {
            const Icon = category.icon
            const isSelected = selectedCategory === category.name
            
            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.4, duration: 0.3 }}
              >
                <motion.button
                  onClick={() => setSelectedCategory(isSelected ? null : category.name)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 ${
                    isSelected 
                      ? 'bg-slate-700/50 border border-slate-600/50' 
                      : 'hover:bg-slate-700/30'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${category.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{category.name}</p>
                    <p className="text-xs text-slate-400">{category.count} documents</p>
                  </div>
                  <motion.div
                    animate={{ rotate: isSelected ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                  </motion.div>
                </motion.button>

                {/* Document List */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 ml-8 space-y-1 overflow-hidden"
                    >
                      {category.docs.map((doc, docIndex) => (
                        <motion.div
                          key={doc.title}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: docIndex * 0.05 }}
                          whileHover={{ scale: 1.02 }}
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-700/20 transition-all duration-200 cursor-pointer group"
                        >
                          <FileText className="w-3 h-3 text-slate-500" />
                          <span className="text-xs text-slate-300 flex-1 group-hover:text-white transition-colors">
                            {doc.title}
                          </span>
                          {doc.starred && (
                            <Star className="w-3 h-3 text-yellow-400" />
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Quick Access Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.3 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-full mt-6 py-2 px-4 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white text-sm font-medium rounded-lg transition-all duration-200 border border-slate-600/50 hover:border-slate-500/50 flex items-center justify-center gap-2"
      >
        <BookOpen className="w-4 h-4" />
        Open Full Documentation
      </motion.button>
    </div>
  )
}