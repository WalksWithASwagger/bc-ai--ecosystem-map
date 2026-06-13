'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ChartBarIcon, 
  ChartPieIcon, 
  MapIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
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
  AreaChart
} from 'recharts'

interface ChartData {
  name: string
  value: number
  growth?: number
  category?: string
}

const RefinedDataVisualization: React.FC = () => {
  const [selectedChart, setSelectedChart] = useState<'categories' | 'funding' | 'growth' | 'regions'>('categories')

  // Sample data for different charts
  const categoryData: ChartData[] = [
    { name: 'AI/ML', value: 387, growth: 18 },
    { name: 'Biotech', value: 245, growth: 12 },
    { name: 'CleanTech', value: 198, growth: 25 },
    { name: 'FinTech', value: 167, growth: 15 },
    { name: 'HealthTech', value: 134, growth: 22 },
    { name: 'EdTech', value: 89, growth: 8 },
  ]

  const fundingData: ChartData[] = [
    { name: 'Seed', value: 450, growth: 15 },
    { name: 'Series A', value: 280, growth: 22 },
    { name: 'Series B', value: 120, growth: 18 },
    { name: 'Series C+', value: 65, growth: 12 },
    { name: 'Growth', value: 35, growth: 8 },
  ]

  const growthData: ChartData[] = [
    { name: 'Jan', value: 1200 },
    { name: 'Feb', value: 1280 },
    { name: 'Mar', value: 1350 },
    { name: 'Apr', value: 1420 },
    { name: 'May', value: 1450 },
    { name: 'Jun', value: 1450 },
  ]

  const regionData: ChartData[] = [
    { name: 'Vancouver', value: 680, category: 'Metro' },
    { name: 'Victoria', value: 245, category: 'Island' },
    { name: 'Burnaby', value: 180, category: 'Metro' },
    { name: 'Surrey', value: 125, category: 'Metro' },
    { name: 'Richmond', value: 98, category: 'Metro' },
    { name: 'Other', value: 122, category: 'Various' },
  ]

  const chartTypes = [
    {
      id: 'categories',
      label: 'Industry Categories',
      icon: ChartBarIcon,
      description: 'Organizations by industry sector'
    },
    {
      id: 'funding',
      label: 'Funding Stages', 
      icon: ChartPieIcon,
      description: 'Distribution by funding stage'
    },
    {
      id: 'growth',
      label: 'Growth Trend',
      icon: ArrowTrendingUpIcon,
      description: 'Monthly organization growth'
    },
    {
      id: 'regions',
      label: 'Regional Distribution',
      icon: MapIcon,
      description: 'Geographic distribution across BC'
    }
  ] as const

  const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

  const renderChart = () => {
    switch (selectedChart) {
      case 'categories':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      
      case 'funding':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={fundingData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {fundingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )
      
      case 'growth':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={growthData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorGrowth)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )
      
      case 'regions':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      
      default:
        return null
    }
  }

  return (
    <motion.section
      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Data Insights</h2>
            <p className="text-sm text-gray-600 mt-1">Ecosystem analytics and trends</p>
          </div>
          
          {/* Chart Type Selector */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            {chartTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedChart(type.id as any)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedChart === type.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <type.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{type.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Chart Content */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-base font-medium text-gray-900">
            {chartTypes.find(t => t.id === selectedChart)?.label}
          </h3>
          <p className="text-sm text-gray-600">
            {chartTypes.find(t => t.id === selectedChart)?.description}
          </p>
        </div>
        
        <motion.div
          key={selectedChart}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {renderChart()}
        </motion.div>
      </div>
    </motion.section>
  )
}

export default RefinedDataVisualization