'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  X, 
  Bookmark,
  BookmarkCheck,
  Download,
  ArrowUpDown,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Tag,
  Zap,
  Star,
  TrendingUp,
  Eye,
  EyeOff
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
  description: string
  focusAreas: string[]
  governmentTier: string
  trendingScore: number
  website: string
  linkedin?: string
}

interface SearchFilters {
  query: string
  categories: string[]
  locations: string[]
  fundingRange: [number, number]
  foundedRange: [number, number]
  governmentTiers: string[]
  focusAreas: string[]
  teamSizeRange: [number, number]
  trending: boolean
  hasLogo: boolean
}

interface SavedFilter {
  id: string
  name: string
  filters: SearchFilters
  isPublic: boolean
  createdAt: Date
}

interface AdvancedSearchProps {
  companies: Company[]
  onResultsChange: (results: Company[]) => void
  onCompanySelect: (company: Company) => void
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  companies,
  onResultsChange,
  onCompanySelect
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    categories: [],
    locations: [],
    fundingRange: [0, 5000],
    foundedRange: [1990, 2025],
    governmentTiers: [],
    focusAreas: [],
    teamSizeRange: [1, 10000],
    trending: false,
    hasLogo: false
  })

  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [bookmarkedCompanies, setBookmarkedCompanies] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid')
  const [sortBy, setSortBy] = useState<'relevance' | 'name' | 'funding' | 'founded' | 'trending'>('relevance')

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const categories = [...new Set(companies.map(c => c.category))].sort()
    const locations = [...new Set(companies.map(c => c.location))].sort()
    const governmentTiers = [...new Set(companies.map(c => c.governmentTier))].sort()
    const allFocusAreas = companies.flatMap(c => c.focusAreas)
    const focusAreas = [...new Set(allFocusAreas)].sort()
    
    return { categories, locations, governmentTiers, focusAreas }
  }, [companies])

  // Smart search algorithm
  const searchResults = useMemo(() => {
    let results = companies.filter(company => {
      // Text search
      if (filters.query) {
        const searchText = filters.query.toLowerCase()
        const searchableText = [
          company.name,
          company.category,
          company.description,
          company.location,
          ...company.focusAreas
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(searchText)) return false
      }

      // Category filter
      if (filters.categories.length > 0 && !filters.categories.includes(company.category)) {
        return false
      }

      // Location filter
      if (filters.locations.length > 0 && !filters.locations.includes(company.location)) {
        return false
      }

      // Government tier filter
      if (filters.governmentTiers.length > 0 && !filters.governmentTiers.includes(company.governmentTier)) {
        return false
      }

      // Focus areas filter
      if (filters.focusAreas.length > 0) {
        const hasMatchingFocus = filters.focusAreas.some(area => 
          company.focusAreas.some(companyArea => 
            companyArea.toLowerCase().includes(area.toLowerCase())
          )
        )
        if (!hasMatchingFocus) return false
      }

      // Funding range
      const fundingAmount = parseFloat(company.funding.replace(/[^\d.]/g, ''))
      if (fundingAmount < filters.fundingRange[0] || fundingAmount > filters.fundingRange[1]) {
        return false
      }

      // Founded range
      if (company.founded < filters.foundedRange[0] || company.founded > filters.foundedRange[1]) {
        return false
      }

      // Team size range
      const teamSize = parseFloat(company.employees.replace(/[^\d.]/g, ''))
      if (teamSize < filters.teamSizeRange[0] || teamSize > filters.teamSizeRange[1]) {
        return false
      }

      // Trending filter
      if (filters.trending && company.trendingScore < 70) {
        return false
      }

      // Has logo filter
      if (filters.hasLogo && !company.logo) {
        return false
      }

      return true
    })

    // Sort results
    if (sortBy === 'name') {
      results.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'funding') {
      results.sort((a, b) => {
        const aFunding = parseFloat(a.funding.replace(/[^\d.]/g, ''))
        const bFunding = parseFloat(b.funding.replace(/[^\d.]/g, ''))
        return bFunding - aFunding
      })
    } else if (sortBy === 'founded') {
      results.sort((a, b) => b.founded - a.founded)
    } else if (sortBy === 'trending') {
      results.sort((a, b) => b.trendingScore - a.trendingScore)
    }

    return results
  }, [companies, filters, sortBy])

  // Update results when search changes
  useEffect(() => {
    onResultsChange(searchResults)
  }, [searchResults, onResultsChange])

  const saveCurrentFilter = () => {
    const filterName = prompt('Enter a name for this filter:')
    if (filterName) {
      const newFilter: SavedFilter = {
        id: Date.now().toString(),
        name: filterName,
        filters: { ...filters },
        isPublic: false,
        createdAt: new Date()
      }
      setSavedFilters(prev => [...prev, newFilter])
    }
  }

  const loadSavedFilter = (savedFilter: SavedFilter) => {
    setFilters(savedFilter.filters)
  }

  const deleteSavedFilter = (filterId: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== filterId))
  }

  const toggleBookmark = (companyId: string) => {
    setBookmarkedCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    )
  }

  const exportResults = (format: 'csv' | 'json') => {
    const data = searchResults.map(company => ({
      name: company.name,
      category: company.category,
      location: company.location,
      founded: company.founded,
      funding: company.funding,
      employees: company.employees,
      governmentTier: company.governmentTier,
      trendingScore: company.trendingScore,
      website: company.website,
      focusAreas: company.focusAreas.join(', ')
    }))

    if (format === 'csv') {
      const csv = [
        Object.keys(data[0]).join(','),
        ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
      ].join('\n')
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bc-ai-companies-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    } else {
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bc-ai-companies-${new Date().toISOString().split('T')[0]}.json`
      a.click()
    }
  }

  const clearFilters = () => {
    setFilters({
      query: '',
      categories: [],
      locations: [],
      fundingRange: [0, 5000],
      foundedRange: [1990, 2025],
      governmentTiers: [],
      focusAreas: [],
      teamSizeRange: [1, 10000],
      trending: false,
      hasLogo: false
    })
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.query) count++
    if (filters.categories.length > 0) count++
    if (filters.locations.length > 0) count++
    if (filters.governmentTiers.length > 0) count++
    if (filters.focusAreas.length > 0) count++
    if (filters.trending) count++
    if (filters.hasLogo) count++
    return count
  }, [filters])

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Search Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search companies, technologies, people..."
              value={filters.query}
              onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
              isOpen
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            <Filter size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </motion.button>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Selector */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {['grid', 'list', 'table'].map((mode) => (
              <motion.button
                key={mode}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode(mode as any)}
                className={`px-3 py-1 rounded text-sm font-medium transition-all capitalize ${
                  viewMode === mode
                    ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {mode}
              </motion.button>
            ))}
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="relevance">Sort by Relevance</option>
            <option value="name">Sort by Name</option>
            <option value="funding">Sort by Funding</option>
            <option value="founded">Sort by Founded</option>
            <option value="trending">Sort by Trending</option>
          </select>

          {/* Export Button */}
          <div className="relative group">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Download size={16} />
              Export
            </motion.button>
            <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => exportResults('csv')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
              >
                Export as CSV
              </button>
              <button
                onClick={() => exportResults('json')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
              >
                Export as JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {searchResults.length} companies found
          </span>
          {bookmarkedCompanies.length > 0 && (
            <span className="text-sm text-blue-600 dark:text-blue-400">
              {bookmarkedCompanies.length} bookmarked
            </span>
          )}
        </div>
        
        {activeFilterCount > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearFilters}
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Clear all filters
          </motion.button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-200 dark:border-gray-700 pt-6 mb-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categories
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filterOptions.categories.map(category => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, categories: [...prev.categories, category] }))
                          } else {
                            setFilters(prev => ({ ...prev, categories: prev.categories.filter(c => c !== category) }))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Locations
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filterOptions.locations.map(location => (
                    <label key={location} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.locations.includes(location)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, locations: [...prev.locations, location] }))
                          } else {
                            setFilters(prev => ({ ...prev, locations: prev.locations.filter(l => l !== location) }))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{location}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Government Tier Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Government Tiers
                </label>
                <div className="space-y-2">
                  {filterOptions.governmentTiers.map(tier => (
                    <label key={tier} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.governmentTiers.includes(tier)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, governmentTiers: [...prev.governmentTiers, tier] }))
                          } else {
                            setFilters(prev => ({ ...prev, governmentTiers: prev.governmentTiers.filter(t => t !== tier) }))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{tier}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Focus Areas Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Focus Areas
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {filterOptions.focusAreas.slice(0, 10).map(area => (
                    <label key={area} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.focusAreas.includes(area)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({ ...prev, focusAreas: [...prev.focusAreas, area] }))
                          } else {
                            setFilters(prev => ({ ...prev, focusAreas: prev.focusAreas.filter(a => a !== area) }))
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{area}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Quick Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quick Filters
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.trending}
                      onChange={(e) => setFilters(prev => ({ ...prev, trending: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Trending companies</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.hasLogo}
                      onChange={(e) => setFilters(prev => ({ ...prev, hasLogo: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Has company logo</span>
                  </label>
                </div>
              </div>

              {/* Saved Filters */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Saved Filters
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={saveCurrentFilter}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Save Current
                  </motion.button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {savedFilters.map(savedFilter => (
                    <div key={savedFilter.id} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
                      <button
                        onClick={() => loadSavedFilter(savedFilter)}
                        className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 truncate flex-1 text-left"
                      >
                        {savedFilter.name}
                      </button>
                      <button
                        onClick={() => deleteSavedFilter(savedFilter.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results */}
      <div className="space-y-4">
        {searchResults.slice(0, 20).map(company => (
          <motion.div
            key={company.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            onClick={() => onCompanySelect(company)}
            className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-all"
          >
            {/* Company Logo */}
            {company.logo ? (
              <img 
                src={company.logo} 
                alt={`${company.name} logo`}
                className="w-12 h-12 rounded-lg object-contain bg-white p-1"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {company.name.charAt(0)}
              </div>
            )}

            {/* Company Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {company.name}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleBookmark(company.id)
                  }}
                  className={`${
                    bookmarkedCompanies.includes(company.id) 
                      ? 'text-yellow-500' 
                      : 'text-gray-400 hover:text-yellow-500'
                  } transition-colors`}
                >
                  {bookmarkedCompanies.includes(company.id) ? 
                    <BookmarkCheck size={16} /> : 
                    <Bookmark size={16} />
                  }
                </motion.button>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                <span className="flex items-center gap-1">
                  <Tag size={12} />
                  {company.category}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {company.location}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign size={12} />
                  {company.funding}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {company.employees}
                </span>
              </div>
            </div>

            {/* Trending Score */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                company.trendingScore >= 80 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                company.trendingScore >= 60 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                <Zap size={10} />
                {company.trendingScore}
              </div>
            </div>
          </motion.div>
        ))}

        {searchResults.length > 20 && (
          <div className="text-center pt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Showing first 20 of {searchResults.length} results
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdvancedSearch