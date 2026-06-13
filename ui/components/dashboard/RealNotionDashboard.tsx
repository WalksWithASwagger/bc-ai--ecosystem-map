'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import LogoDisplay from '../LogoDisplay'

interface RealCompany {
  id: string
  name: string
  logo?: string | null
  category: string
  funding?: string
  size?: string
  website?: string
  region?: string
  yearFounded?: number
}

export default function RealNotionDashboard() {
  const [companies, setCompanies] = useState<RealCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRealCompanies() {
      try {
        const response = await fetch('/api/notion/companies')
        if (!response.ok) throw new Error('Failed to fetch companies')
        
        const data = await response.json()
        setCompanies(data)

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('❌ Error loading companies:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRealCompanies()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading real companies from Notion...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
        <p className="text-red-400">Error loading companies: {error}</p>
      </div>
    )
  }

  const featuredCompanies = companies.slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            🏆 Real Companies from Notion Database
            <span className="text-sm font-normal text-slate-400">
              ({companies.length} with logos)
            </span>
          </h3>
          <motion.span 
            className="text-xs px-3 py-1 bg-gradient-to-r from-green-500/20 to-cyan-500/20 text-green-300 rounded-full border border-green-500/30"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            Live from Database
          </motion.span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {featuredCompanies.map((company, index) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="group cursor-pointer"
            >
              <div className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-700/30 transition-colors duration-200">
                <LogoDisplay 
                  company={company}
                  size="lg"
                  className="group-hover:shadow-lg transition-shadow duration-200"
                />
                <div className="text-center">
                  <div className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors">
                    {company.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {company.category}
                  </div>
                  {company.funding && (
                    <div className="text-xs text-green-400 mt-1">
                      {company.funding.substring(0, 20)}
                      {company.funding.length > 20 ? '...' : ''}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {companies.length > 8 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-400">
              And {companies.length - 8} more companies with logos in your database
            </p>
          </div>
        )}
      </div>
      
      {/* Real Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">{companies.length}</div>
          <div className="text-sm text-slate-300">Companies with Logos</div>
        </div>
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {Math.round((companies.length / 692) * 100)}%
          </div>
          <div className="text-sm text-slate-300">Visual Coverage</div>
        </div>
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {new Set(companies.map(c => c.category)).size}
          </div>
          <div className="text-sm text-slate-300">Categories</div>
        </div>
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">
            {companies.filter(c => c.funding?.includes('$')).length}
          </div>
          <div className="text-sm text-slate-300">Funded Companies</div>
        </div>
      </div>
    </div>
  )
}