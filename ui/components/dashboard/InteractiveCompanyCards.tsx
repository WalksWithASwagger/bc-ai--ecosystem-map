'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { 
  ExternalLink, 
  MapPin, 
  Users, 
  Calendar, 
  DollarSign, 
  Target, 
  Award,
  X,
  TrendingUp,
  Building,
  Globe,
  LinkedinIcon,
  Star,
  Zap
} from 'lucide-react'

interface Company {
  id: string
  name: string
  logo?: string
  category: string
  location: string
  founded: number
  funding: string
  employees: string
  revenue?: string
  valuation?: string
  description: string
  website: string
  linkedin?: string
  keyPeople: string[]
  focusAreas: string[]
  achievements: string[]
  governmentTier: 'Champion' | 'Major Player' | 'Rising Star' | 'Emerging'
  trendingScore: number
}

interface InteractiveCompanyCardsProps {
  companies: Company[]
  onCompanyClick?: (company: Company) => void
}

const InteractiveCompanyCards: React.FC<InteractiveCompanyCardsProps> = ({ 
  companies,
  onCompanyClick 
}) => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'trending' | 'funding' | 'founded' | 'name'>('trending')
  const [filterTier, setFilterTier] = useState<string>('all')

  const sortedCompanies = [...companies].sort((a, b) => {
    switch (sortBy) {
      case 'trending':
        return b.trendingScore - a.trendingScore
      case 'funding':
        return parseFloat(b.funding.replace(/[^\d.]/g, '')) - parseFloat(a.funding.replace(/[^\d.]/g, ''))
      case 'founded':
        return b.founded - a.founded
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  const filteredCompanies = filterTier === 'all' 
    ? sortedCompanies 
    : sortedCompanies.filter(c => c.governmentTier === filterTier)

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Champion': return 'from-yellow-400 to-yellow-600'
      case 'Major Player': return 'from-blue-400 to-blue-600'
      case 'Rising Star': return 'from-green-400 to-green-600'
      case 'Emerging': return 'from-purple-400 to-purple-600'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Champion': return <Award className="text-yellow-300" size={16} />
      case 'Major Player': return <Building className="text-blue-300" size={16} />
      case 'Rising Star': return <TrendingUp className="text-green-300" size={16} />
      case 'Emerging': return <Zap className="text-purple-300" size={16} />
      default: return <Star className="text-gray-300" size={16} />
    }
  }

  const cardVariants = {
    hidden: { y: 50, opacity: 0, scale: 0.9 },
    visible: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
        mass: 1
      }
    },
    hover: {
      y: -8,
      scale: 1.02,
      boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.2)",
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 20
      }
    },
    tap: {
      scale: 0.98,
      transition: {
        type: "spring" as const,
        stiffness: 400,
        damping: 20
      }
    }
  }

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 50
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 50,
      transition: {
        duration: 0.2
      }
    }
  }

  const CompanyCard: React.FC<{ company: Company, index: number }> = ({ company, index }) => {
    const cardRef = useRef<HTMLDivElement>(null)
    const x = useMotionValue(0)
    const y = useMotionValue(0)
    const rotateX = useTransform(y, [-100, 100], [30, -30])
    const rotateY = useTransform(x, [-100, 100], [-30, 30])

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return
      
      const rect = cardRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      x.set(event.clientX - centerX)
      y.set(event.clientY - centerY)
    }

    const handleMouseLeave = () => {
      x.set(0)
      y.set(0)
    }

    return (
      <motion.div
        ref={cardRef}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        whileTap="tap"
        custom={index}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onHoverStart={() => setHoveredCard(company.id)}
        onHoverEnd={() => setHoveredCard(null)}
        onClick={() => {
          setSelectedCompany(company)
          onCompanyClick?.(company)
        }}
        className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 cursor-pointer overflow-hidden border border-gray-200 dark:border-gray-700 group"
        style={{
          perspective: "1000px",
          rotateX,
          rotateY,
          transformStyle: "preserve-3d"
        }}
      >
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getTierColor(company.governmentTier)} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
        
        {/* Trending Score Badge */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: index * 0.1 + 0.3, type: "spring" as const, stiffness: 200 }}
          className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full"
        >
          🔥 {company.trendingScore}
        </motion.div>

        {/* Tier Badge */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.1 + 0.4 }}
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getTierColor(company.governmentTier)} mb-4`}
        >
          {getTierIcon(company.governmentTier)}
          {company.governmentTier}
        </motion.div>

        {/* Company Logo & Name */}
        <div className="flex items-center gap-4 mb-4">
          {company.logo ? (
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center shadow-lg"
            >
              <img 
                src={company.logo} 
                alt={`${company.name} logo`}
                className="w-full h-full object-contain"
              />
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg"
            >
              {company.name.charAt(0)}
            </motion.div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {company.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
              {company.category}
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <DollarSign className="text-green-500" size={16} />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Funding</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{company.funding}</p>
            </div>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <Users className="text-blue-500" size={16} />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Team</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{company.employees}</p>
            </div>
          </motion.div>
        </div>

        {/* Location & Founded */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
          <div className="flex items-center gap-1">
            <MapPin size={14} />
            {company.location}
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            Founded {company.founded}
          </div>
        </div>

        {/* Focus Areas */}
        <div className="flex flex-wrap gap-1 mb-4">
          {company.focusAreas.slice(0, 3).map((area, i) => (
            <motion.span
              key={area}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 + i * 0.1 + 0.5 }}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
            >
              {area}
            </motion.span>
          ))}
          {company.focusAreas.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
              +{company.focusAreas.length - 3}
            </span>
          )}
        </div>

        {/* Hover Actions */}
        <AnimatePresence>
          {hoveredCard === company.id && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex gap-2 mt-4"
            >
              {company.website && (
                <motion.a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600"
                >
                  <Globe size={12} />
                  Website
                </motion.a>
              )}
              {company.linkedin && (
                <motion.a
                  href={company.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-700 text-white text-xs rounded-full hover:bg-blue-800"
                >
                  <LinkedinIcon size={12} />
                  LinkedIn
                </motion.a>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="trending">Sort by Trending Score</option>
            <option value="funding">Sort by Funding</option>
            <option value="founded">Sort by Founded Date</option>
            <option value="name">Sort by Name</option>
          </select>
          
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Tiers</option>
            <option value="Champion">Champions</option>
            <option value="Major Player">Major Players</option>
            <option value="Rising Star">Rising Stars</option>
            <option value="Emerging">Emerging</option>
          </select>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredCompanies.length} companies
        </div>
      </div>

      {/* Company Grid */}
      <motion.div
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredCompanies.map((company, index) => (
          <CompanyCard key={company.id} company={company} index={index} />
        ))}
      </motion.div>

      {/* Company Detail Modal */}
      <AnimatePresence>
        {selectedCompany && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedCompany(null)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  {selectedCompany.logo ? (
                    <img 
                      src={selectedCompany.logo} 
                      alt={`${selectedCompany.name} logo`}
                      className="w-20 h-20 rounded-xl object-contain bg-gray-100 dark:bg-gray-700 p-2"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                      {selectedCompany.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedCompany.name}
                    </h2>
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white bg-gradient-to-r ${getTierColor(selectedCompany.governmentTier)}`}>
                      {getTierIcon(selectedCompany.governmentTier)}
                      {selectedCompany.governmentTier}
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedCompany(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={24} />
                </motion.button>
              </div>

              {/* Company Details Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">About</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {selectedCompany.description}
                    </p>
                  </div>

                  {/* Key People */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Key People</h3>
                    <div className="space-y-2">
                      {selectedCompany.keyPeople.map((person, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {person.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-gray-900 dark:text-white font-medium">{person}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Achievements */}
                  {selectedCompany.achievements.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Achievements</h3>
                      <div className="space-y-2">
                        {selectedCompany.achievements.map((achievement, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
                          >
                            <Award className="text-yellow-600 mt-0.5" size={16} />
                            <span className="text-gray-900 dark:text-white text-sm">{achievement}</span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="text-green-500" size={20} />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Funding</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedCompany.funding}</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="text-blue-500" size={20} />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Employees</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedCompany.employees}</p>
                    </div>

                    {selectedCompany.valuation && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="text-purple-500" size={20} />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Valuation</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedCompany.valuation}</p>
                      </div>
                    )}

                    {selectedCompany.revenue && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="text-orange-500" size={20} />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedCompany.revenue}</p>
                      </div>
                    )}
                  </div>

                  {/* Focus Areas */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">AI Focus Areas</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCompany.focusAreas.map((area, index) => (
                        <motion.span
                          key={area}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium"
                        >
                          {area}
                        </motion.span>
                      ))}
                    </div>
                  </div>

                  {/* Company Info */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <MapPin className="text-gray-500" size={20} />
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Location</span>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedCompany.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Calendar className="text-gray-500" size={20} />
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Founded</span>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedCompany.founded}</p>
                      </div>
                    </div>
                  </div>

                  {/* Links */}
                  <div className="flex gap-3">
                    {selectedCompany.website && (
                      <motion.a
                        href={selectedCompany.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Globe size={16} />
                        Visit Website
                      </motion.a>
                    )}
                    {selectedCompany.linkedin && (
                      <motion.a
                        href={selectedCompany.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                      >
                        <LinkedinIcon size={16} />
                        LinkedIn
                      </motion.a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default InteractiveCompanyCards