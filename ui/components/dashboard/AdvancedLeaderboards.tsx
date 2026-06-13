'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, 
  Medal, 
  Star, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Award,
  Zap,
  Target,
  Crown,
  Flame,
  ChevronRight
} from 'lucide-react'

interface LeaderboardCompany {
  id: string
  name: string
  logo?: string
  rank: number
  score: number
  category: string
  funding: string
  employees: string
  founded: number
  trendingScore: number
  governmentTier: 'Champion' | 'Major Player' | 'Rising Star' | 'Emerging'
  change: 'up' | 'down' | 'same'
  changeAmount: number
}

type SortField = 'score' | 'funding' | 'employees' | 'founded' | 'trendingScore'
type SortDirection = 'asc' | 'desc'

interface AdvancedLeaderboardsProps {
  companies: LeaderboardCompany[]
}

const AdvancedLeaderboards: React.FC<AdvancedLeaderboardsProps> = ({ companies }) => {
  const [activeLeaderboard, setActiveLeaderboard] = useState<'overall' | 'funding' | 'trending' | 'growth'>('overall')
  const [sortField, setSortField] = useState<SortField>('score')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [showTop, setShowTop] = useState<number>(20)

  const leaderboards = [
    { 
      id: 'overall', 
      name: 'Overall Excellence', 
      icon: Trophy, 
      color: 'from-yellow-400 to-yellow-600',
      description: 'Comprehensive ranking based on all metrics'
    },
    { 
      id: 'funding', 
      name: 'Funding Leaders', 
      icon: DollarSign, 
      color: 'from-green-400 to-green-600',
      description: 'Ranked by total funding raised'
    },
    { 
      id: 'trending', 
      name: 'Trending Now', 
      icon: Flame, 
      color: 'from-orange-400 to-red-600',
      description: 'Hottest companies by recent momentum'
    },
    { 
      id: 'growth', 
      name: 'Growth Stars', 
      icon: TrendingUp, 
      color: 'from-purple-400 to-purple-600',
      description: 'Fastest growing companies'
    }
  ]

  const categories = [...new Set(companies.map(c => c.category))]
  const tiers = ['Champion', 'Major Player', 'Rising Star', 'Emerging']

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedAndFilteredCompanies = useMemo(() => {
    let filtered = companies.filter(company => {
      const categoryMatch = filterCategory === 'all' || company.category === filterCategory
      const tierMatch = filterTier === 'all' || company.governmentTier === filterTier
      return categoryMatch && tierMatch
    })

    // Apply leaderboard-specific sorting
    if (activeLeaderboard === 'funding') {
      filtered.sort((a, b) => {
        const aFunding = parseFloat(a.funding.replace(/[^\d.]/g, ''))
        const bFunding = parseFloat(b.funding.replace(/[^\d.]/g, ''))
        return bFunding - aFunding
      })
    } else if (activeLeaderboard === 'trending') {
      filtered.sort((a, b) => b.trendingScore - a.trendingScore)
    } else if (activeLeaderboard === 'growth') {
      filtered.sort((a, b) => b.changeAmount - a.changeAmount)
    } else {
      // Overall - use custom sort
      filtered.sort((a, b) => {
        const getValue = (company: LeaderboardCompany, field: SortField): number => {
          switch (field) {
            case 'score': return company.score
            case 'funding': return parseFloat(company.funding.replace(/[^\d.]/g, ''))
            case 'employees': return parseFloat(company.employees.replace(/[^\d.]/g, ''))
            case 'founded': return company.founded
            case 'trendingScore': return company.trendingScore
            default: return 0
          }
        }

        const aValue = getValue(a, sortField)
        const bValue = getValue(b, sortField)
        
        return sortDirection === 'desc' ? bValue - aValue : aValue - bValue
      })
    }

    return filtered.slice(0, showTop)
  }, [companies, activeLeaderboard, sortField, sortDirection, filterCategory, filterTier, showTop])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="text-yellow-500" size={20} />
      case 2: return <Trophy className="text-gray-400" size={20} />
      case 3: return <Medal className="text-amber-600" size={20} />
      default: return <span className="font-bold text-gray-600 dark:text-gray-400">#{rank}</span>
    }
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600'
    if (rank === 2) return 'from-gray-300 to-gray-500'
    if (rank === 3) return 'from-amber-400 to-amber-600'
    if (rank <= 10) return 'from-blue-400 to-blue-600'
    return 'from-gray-200 to-gray-400'
  }

  const getChangeIcon = (change: 'up' | 'down' | 'same', amount: number) => {
    if (change === 'up') return <ArrowUp className="text-green-500" size={16} />
    if (change === 'down') return <ArrowDown className="text-red-500" size={16} />
    return <div className="w-4 h-4" />
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 10
      }
    }
  }

  const rankingVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 20
      }
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🏆 Interactive Leaderboards
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Dynamic rankings with advanced sorting and filtering
          </p>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium"
        >
          Live Rankings
        </motion.div>
      </div>

      {/* Leaderboard Tabs */}
      <div className="flex flex-wrap gap-3 mb-8">
        {leaderboards.map((board) => {
          const Icon = board.icon
          return (
            <motion.button
              key={board.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveLeaderboard(board.id as any)}
              className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all ${
                activeLeaderboard === board.id
                  ? `bg-gradient-to-r ${board.color} text-white shadow-lg`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <Icon size={20} />
              <div className="text-left">
                <div className="font-semibold">{board.name}</div>
                <div className="text-xs opacity-80">{board.description}</div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
        <div className="flex flex-wrap gap-3">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          {/* Tier Filter */}
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tiers</option>
            {tiers.map(tier => (
              <option key={tier} value={tier}>{tier}</option>
            ))}
          </select>

          {/* Show Top N */}
          <select
            value={showTop}
            onChange={(e) => setShowTop(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
            <option value={100}>Top 100</option>
          </select>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {sortedAndFilteredCompanies.length} companies
        </div>
      </div>

      {/* Sort Headers */}
      <div className="grid grid-cols-12 gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 text-sm font-medium text-gray-700 dark:text-gray-300">
        <div className="col-span-1 text-center">Rank</div>
        <div className="col-span-4">Company</div>
        <div className="col-span-1 text-center">
          <button
            onClick={() => handleSort('score')}
            className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Score
            {sortField === 'score' && (
              sortDirection === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />
            )}
          </button>
        </div>
        <div className="col-span-2 text-center">
          <button
            onClick={() => handleSort('funding')}
            className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Funding
            {sortField === 'funding' && (
              sortDirection === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />
            )}
          </button>
        </div>
        <div className="col-span-2 text-center">
          <button
            onClick={() => handleSort('employees')}
            className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
          >
            Team Size
            {sortField === 'employees' && (
              sortDirection === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />
            )}
          </button>
        </div>
        <div className="col-span-1 text-center">
          <button
            onClick={() => handleSort('trendingScore')}
            className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400"
          >
            🔥 Trend
            {sortField === 'trendingScore' && (
              sortDirection === 'desc' ? <ArrowDown size={14} /> : <ArrowUp size={14} />
            )}
          </button>
        </div>
        <div className="col-span-1 text-center">Change</div>
      </div>

      {/* Leaderboard List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        <AnimatePresence mode="wait">
          {sortedAndFilteredCompanies.map((company, index) => (
            <motion.div
              key={`${activeLeaderboard}-${company.id}`}
              variants={itemVariants}
              layout
              whileHover={{ 
                scale: 1.01,
                boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.1)"
              }}
              className="grid grid-cols-12 gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer group"
            >
              {/* Rank */}
              <div className="col-span-1 flex items-center justify-center">
                <motion.div
                  variants={rankingVariants}
                  className={`flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r ${getRankBadgeColor(index + 1)} text-white font-bold shadow-lg`}
                >
                  {index + 1 <= 3 ? getRankIcon(index + 1) : index + 1}
                </motion.div>
              </div>

              {/* Company Info */}
              <div className="col-span-4 flex items-center gap-3">
                {company.logo ? (
                  <motion.img
                    whileHover={{ scale: 1.1 }}
                    src={company.logo}
                    alt={`${company.name} logo`}
                    className="w-12 h-12 rounded-lg object-contain bg-gray-100 dark:bg-gray-700 p-1"
                  />
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold"
                  >
                    {company.name.charAt(0)}
                  </motion.div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {company.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {company.category}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${{
                      'Champion': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                      'Major Player': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                      'Rising Star': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                      'Emerging': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    }[company.governmentTier]}`}>
                      {company.governmentTier}
                    </span>
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="col-span-1 flex items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="text-2xl font-bold text-gray-900 dark:text-white"
                >
                  {company.score}
                </motion.div>
              </div>

              {/* Funding */}
              <div className="col-span-2 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {company.funding}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Total Raised
                  </div>
                </div>
              </div>

              {/* Team Size */}
              <div className="col-span-2 flex items-center justify-center">
                <div className="text-center">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {company.employees}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Employees
                  </div>
                </div>
              </div>

              {/* Trending Score */}
              <div className="col-span-1 flex items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.2 }}
                  className="flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full text-sm font-medium"
                >
                  <Flame size={14} />
                  {company.trendingScore}
                </motion.div>
              </div>

              {/* Change */}
              <div className="col-span-1 flex items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center gap-1"
                >
                  {getChangeIcon(company.change, company.changeAmount)}
                  <span className={`text-sm font-medium ${
                    company.change === 'up' ? 'text-green-600' : 
                    company.change === 'down' ? 'text-red-600' : 
                    'text-gray-600'
                  }`}>
                    {company.changeAmount > 0 && company.change !== 'same' && (
                      company.change === 'up' ? '+' : '-'
                    )}
                    {company.change !== 'same' && company.changeAmount}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Load More */}
      {sortedAndFilteredCompanies.length >= showTop && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center mt-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowTop(showTop + 20)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Load More Companies
            <ChevronRight size={20} />
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}

export default AdvancedLeaderboards