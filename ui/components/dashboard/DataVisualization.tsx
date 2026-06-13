'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap
} from 'recharts'
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  Activity,
  Map,
  Radar as RadarIcon,
  Calendar,
  DollarSign,
  Users,
  Building,
  Zap,
  Target,
  Eye,
  Download,
  Maximize2
} from 'lucide-react'

interface Company {
  id: string
  name: string
  category: string
  location: string
  founded: number
  funding: string
  employees: string
  governmentTier: string
  trendingScore: number
  revenue?: string
  valuation?: string
}

interface DataVisualizationProps {
  companies: Company[]
}

const DataVisualization: React.FC<DataVisualizationProps> = ({ companies }) => {
  const [activeChart, setActiveChart] = useState<'overview' | 'funding' | 'timeline' | 'geographic' | 'sectors' | 'growth'>('overview')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Color schemes for charts
  const colors = {
    primary: ['#3B82F6', '#1D4ED8', '#1E40AF', '#1E3A8A'],
    categorical: ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#8B5CF6', '#EC4899'],
    gradient: ['#3B82F6', '#1D4ED8', '#8B5CF6', '#EC4899'],
    government: {
      'Champion': '#EAB308',
      'Major Player': '#3B82F6', 
      'Rising Star': '#22C55E',
      'Emerging': '#8B5CF6'
    }
  }

  // Funding Analysis Data
  const fundingData = useMemo(() => {
    const fundingRanges = [
      { range: '$0-10M', min: 0, max: 10, count: 0, companies: [] as Company[] },
      { range: '$10-50M', min: 10, max: 50, count: 0, companies: [] as Company[] },
      { range: '$50-100M', min: 50, max: 100, count: 0, companies: [] as Company[] },
      { range: '$100-500M', min: 100, max: 500, count: 0, companies: [] as Company[] },
      { range: '$500M+', min: 500, max: Infinity, count: 0, companies: [] as Company[] }
    ]

    companies.forEach(company => {
      const funding = parseFloat(company.funding.replace(/[^\d.]/g, ''))
      const range = fundingRanges.find(r => funding >= r.min && funding < r.max)
      if (range) {
        range.count++
        range.companies.push(company)
      }
    })

    return fundingRanges.filter(r => r.count > 0)
  }, [companies])

  // Timeline Data
  const timelineData = useMemo(() => {
    const yearCounts: { [year: number]: number } = {}
    const yearFunding: { [year: number]: number } = {}
    
    companies.forEach(company => {
      const year = company.founded
      yearCounts[year] = (yearCounts[year] || 0) + 1
      const funding = parseFloat(company.funding.replace(/[^\d.]/g, ''))
      yearFunding[year] = (yearFunding[year] || 0) + funding
    })

    return Object.keys(yearCounts)
      .map(year => ({
        year: parseInt(year),
        companies: yearCounts[parseInt(year)],
        totalFunding: yearFunding[parseInt(year)] || 0,
        avgFunding: yearFunding[parseInt(year)] / yearCounts[parseInt(year)] || 0
      }))
      .sort((a, b) => a.year - b.year)
  }, [companies])

  // Geographic Distribution
  const geographicData = useMemo(() => {
    const locationCounts: { [location: string]: number } = {}
    const locationFunding: { [location: string]: number } = {}
    
    companies.forEach(company => {
      const location = company.location.split(',')[0] // Get city name
      locationCounts[location] = (locationCounts[location] || 0) + 1
      const funding = parseFloat(company.funding.replace(/[^\d.]/g, ''))
      locationFunding[location] = (locationFunding[location] || 0) + funding
    })

    return Object.keys(locationCounts)
      .map(location => ({
        location,
        companies: locationCounts[location],
        totalFunding: locationFunding[location] || 0,
        avgFunding: locationFunding[location] / locationCounts[location] || 0
      }))
      .sort((a, b) => b.companies - a.companies)
      .slice(0, 10)
  }, [companies])

  // Sector Analysis
  const sectorData = useMemo(() => {
    const sectorCounts: { [sector: string]: { count: number, funding: number, trending: number } } = {}
    
    companies.forEach(company => {
      const sector = company.category
      if (!sectorCounts[sector]) {
        sectorCounts[sector] = { count: 0, funding: 0, trending: 0 }
      }
      sectorCounts[sector].count++
      const funding = parseFloat(company.funding.replace(/[^\d.]/g, ''))
      sectorCounts[sector].funding += funding
      sectorCounts[sector].trending += company.trendingScore
    })

    return Object.keys(sectorCounts)
      .map(sector => ({
        sector,
        count: sectorCounts[sector].count,
        totalFunding: sectorCounts[sector].funding,
        avgTrending: sectorCounts[sector].trending / sectorCounts[sector].count,
        avgFunding: sectorCounts[sector].funding / sectorCounts[sector].count
      }))
      .sort((a, b) => b.totalFunding - a.totalFunding)
  }, [companies])

  // Government Tier Distribution
  const tierData = useMemo(() => {
    const tierCounts: { [tier: string]: number } = {}
    companies.forEach(company => {
      tierCounts[company.governmentTier] = (tierCounts[company.governmentTier] || 0) + 1
    })

    return Object.keys(tierCounts).map(tier => ({
      tier,
      count: tierCounts[tier],
      percentage: (tierCounts[tier] / companies.length * 100).toFixed(1)
    }))
  }, [companies])

  // Growth Potential Analysis
  const growthData = useMemo(() => {
    return companies.map(company => ({
      name: company.name,
      funding: parseFloat(company.funding.replace(/[^\d.]/g, '')),
      trending: company.trendingScore,
      age: 2025 - company.founded,
      employees: parseFloat(company.employees.replace(/[^\d.]/g, '')),
      category: company.category,
      tier: company.governmentTier
    })).filter(c => c.funding > 0 && c.trending > 0)
  }, [companies])

  const chartTypes = [
    { 
      id: 'overview', 
      name: 'Ecosystem Overview', 
      icon: PieIcon, 
      description: 'High-level ecosystem distribution'
    },
    { 
      id: 'funding', 
      name: 'Funding Analysis', 
      icon: DollarSign, 
      description: 'Investment patterns and ranges'
    },
    { 
      id: 'timeline', 
      name: 'Timeline View', 
      icon: Calendar, 
      description: 'Company founding timeline'
    },
    { 
      id: 'geographic', 
      name: 'Geographic Map', 
      icon: Map, 
      description: 'Regional distribution'
    },
    { 
      id: 'sectors', 
      name: 'Sector Analysis', 
      icon: Building, 
      description: 'Industry breakdowns'
    },
    { 
      id: 'growth', 
      name: 'Growth Potential', 
      icon: TrendingUp, 
      description: 'Growth indicators analysis'
    }
  ]

  const exportChart = () => {
    // Implementation would depend on the charting library's export capabilities

  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-gray-900 dark:text-white">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const renderChart = () => {
    const chartHeight = isFullscreen ? 600 : 400

    switch (activeChart) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Government Tier Pie Chart */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Government Tier Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tierData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ tier, percentage }) => `${tier}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {tierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors.government[entry.tier as keyof typeof colors.government]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top Sectors Bar Chart */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Sectors by Company Count</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorData.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="sector" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill={colors.primary[0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )

      case 'funding':
        return (
          <div className="space-y-6">
            {/* Funding Distribution */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Funding Distribution</h4>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={fundingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill={colors.primary[1]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sector vs Funding Bubble Chart */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sector Performance (Funding vs Trending Score)</h4>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <ScatterChart data={sectorData}>
                  <CartesianGrid />
                  <XAxis dataKey="totalFunding" name="Total Funding" />
                  <YAxis dataKey="avgTrending" name="Avg Trending Score" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
                            <p className="font-semibold">{data.sector}</p>
                            <p>Companies: {data.count}</p>
                            <p>Total Funding: ${data.totalFunding}M</p>
                            <p>Avg Trending: {data.avgTrending.toFixed(1)}</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Scatter dataKey="count" fill={colors.primary[2]} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )

      case 'timeline':
        return (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Company Founding Timeline</h4>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="companies" 
                  stackId="1"
                  stroke={colors.primary[0]} 
                  fill={colors.primary[0]}
                  fillOpacity={0.6}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="avgFunding" 
                  stroke={colors.categorical[1]} 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )

      case 'geographic':
        return (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Geographic Distribution</h4>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={geographicData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="location" type="category" width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="companies" fill={colors.primary[2]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )

      case 'sectors':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sector Treemap */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sector Market Share</h4>
              <ResponsiveContainer width="100%" height={350}>
                <Treemap
                  data={sectorData}
                  dataKey="totalFunding"
                  aspectRatio={4/3}
                  stroke="#fff"
                  fill={colors.primary[0]}
                />
              </ResponsiveContainer>
            </div>

            {/* Sector Radar */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sector Performance Radar</h4>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={sectorData.slice(0, 6)}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="sector" />
                  <PolarRadiusAxis />
                  <Radar
                    name="Count"
                    dataKey="count"
                    stroke={colors.primary[0]}
                    fill={colors.primary[0]}
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Avg Trending"
                    dataKey="avgTrending"
                    stroke={colors.categorical[1]}
                    fill={colors.categorical[1]}
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )

      case 'growth':
        return (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Growth Potential Matrix</h4>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <ScatterChart data={growthData}>
                <CartesianGrid />
                <XAxis dataKey="funding" name="Funding ($M)" />
                <YAxis dataKey="trending" name="Trending Score" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
                          <p className="font-semibold">{data.name}</p>
                          <p>Category: {data.category}</p>
                          <p>Funding: ${data.funding}M</p>
                          <p>Trending: {data.trending}</p>
                          <p>Age: {data.age} years</p>
                          <p>Employees: {data.employees}</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Scatter dataKey="employees" fill={colors.primary[3]} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )

      default:
        return <div>Select a chart type</div>
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 ${
      isFullscreen ? 'fixed inset-4 z-50' : ''
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📊 Data Visualization Center
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Interactive analytics and insights for the BC AI ecosystem
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportChart}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Download size={16} />
            Export
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Maximize2 size={16} />
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </motion.button>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="flex flex-wrap gap-3 mb-8">
        {chartTypes.map((chart) => {
          const Icon = chart.icon
          return (
            <motion.button
              key={chart.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveChart(chart.id as any)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeChart === chart.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <Icon size={20} />
              <div className="text-left">
                <div className="font-semibold">{chart.name}</div>
                <div className="text-xs opacity-80">{chart.description}</div>
              </div>
            </motion.button>
          )
        })}
      </div>

      {/* Chart Container */}
      <motion.div
        key={activeChart}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-[400px]"
      >
        {renderChart()}
      </motion.div>

      {/* Analytics Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building className="text-blue-600" size={20} />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Companies</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{companies.length}</p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-green-600" size={20} />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">Total Funding</span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            ${companies.reduce((sum, c) => sum + parseFloat(c.funding.replace(/[^\d.]/g, '')), 0).toFixed(0)}M
          </p>
        </div>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-purple-600" size={20} />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Avg Trending</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {(companies.reduce((sum, c) => sum + c.trendingScore, 0) / companies.length).toFixed(1)}
          </p>
        </div>
        
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="text-orange-600" size={20} />
            <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Hot Sectors</span>
          </div>
          <p className="text-xl font-bold text-orange-900 dark:text-orange-100">
            {sectorData.length}
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default DataVisualization