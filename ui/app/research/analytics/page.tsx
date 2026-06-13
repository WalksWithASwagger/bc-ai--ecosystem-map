'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Building2, 
  Users, 
  Target,
  AlertTriangle,
  Globe,
  Brain,
  Zap,
  ArrowUp,
  ArrowDown,
  Calendar
} from 'lucide-react';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export default function ResearchAnalytics() {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('discoveries');

  // Mock data - in real implementation, this would come from your API
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalDiscoveries: 1247,
      avgQualityScore: 84.2,
      pipelineEfficiency: 92.1,
      competitiveAdvantage: '18 days',
      discoveryGrowth: 15.3,
      qualityTrend: 4.7,
      threatAlerts: 12,
      opportunityScore: 89.5
    },
    discoveryTrends: [
      { date: '2024-07-01', companies: 45, funding: 12, competitive: 8, market: 5 },
      { date: '2024-07-08', companies: 52, funding: 15, competitive: 11, market: 7 },
      { date: '2024-07-15', companies: 48, funding: 18, competitive: 9, market: 6 },
      { date: '2024-07-22', companies: 61, funding: 22, competitive: 14, market: 9 },
      { date: '2024-07-29', companies: 58, funding: 19, competitive: 12, market: 8 },
      { date: '2024-08-05', companies: 67, funding: 25, competitive: 16, market: 11 }
    ],
    sectorDistribution: [
      { name: 'AI/ML', value: 35, count: 437, avgScore: 87.2 },
      { name: 'FinTech', value: 22, count: 274, avgScore: 82.1 },
      { name: 'HealthTech', value: 18, count: 224, avgScore: 85.9 },
      { name: 'CleanTech', value: 15, count: 187, avgScore: 79.4 },
      { name: 'Other', value: 10, count: 125, avgScore: 76.8 }
    ],
    qualityDistribution: [
      { tier: 'Tier 1', count: 89, percentage: 7.1, color: '#ef4444' },
      { tier: 'Tier 2', count: 187, percentage: 15.0, color: '#f59e0b' },
      { tier: 'Tier 3', count: 423, percentage: 33.9, color: '#10b981' },
      { tier: 'Tier 4', count: 384, percentage: 30.8, color: '#06b6d4' },
      { tier: 'Tier 5', count: 164, percentage: 13.2, color: '#8b5cf6' }
    ],
    fundingTrends: [
      { month: 'Feb', amount: 145.2, deals: 12, avgDeal: 12.1 },
      { month: 'Mar', amount: 189.5, deals: 15, avgDeal: 12.6 },
      { month: 'Apr', amount: 167.8, deals: 18, avgDeal: 9.3 },
      { month: 'May', amount: 234.1, deals: 22, avgDeal: 10.6 },
      { month: 'Jun', amount: 198.7, deals: 19, avgDeal: 10.5 },
      { month: 'Jul', amount: 276.3, deals: 25, avgDeal: 11.1 }
    ],
    competitiveThreats: [
      { company: 'TechRival Corp', threatScore: 89, sector: 'AI/ML', lastActivity: '2 days ago' },
      { company: 'Innovation Labs', threatScore: 76, sector: 'FinTech', lastActivity: '5 days ago' },
      { company: 'Future Systems', threatScore: 72, sector: 'HealthTech', lastActivity: '1 week ago' },
      { company: 'NextGen Solutions', threatScore: 68, sector: 'CleanTech', lastActivity: '3 days ago' }
    ],
    topOpportunities: [
      { name: 'QuantumFlow AI', score: 94, sector: 'Quantum Computing', stage: 'Series A Prep', fundingPotential: 15.5 },
      { name: 'BioMed Analytics', score: 91, sector: 'HealthTech', stage: 'Seed', fundingPotential: 8.2 },
      { name: 'GreenTech Dynamics', score: 89, sector: 'CleanTech', stage: 'Series B Prep', fundingPotential: 22.1 },
      { name: 'FinanceAI Corp', score: 87, sector: 'FinTech', stage: 'Series A', fundingPotential: 12.8 }
    ]
  });

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(1)}M`;
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-purple-500/20 bg-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Research Intelligence Analytics
              </h1>
              <p className="text-gray-400 mt-2">
                Strategic insights and performance metrics from your research pipelines
              </p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-black/40 border border-purple-500/20 rounded-lg px-4 py-2"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: 'Total Discoveries',
              value: analyticsData.overview.totalDiscoveries.toLocaleString(),
              change: analyticsData.overview.discoveryGrowth,
              icon: Target,
              color: 'text-purple-400'
            },
            {
              label: 'Avg Quality Score',
              value: `${analyticsData.overview.avgQualityScore}/100`,
              change: analyticsData.overview.qualityTrend,
              icon: Brain,
              color: 'text-cyan-400'
            },
            {
              label: 'Pipeline Efficiency',
              value: `${analyticsData.overview.pipelineEfficiency}%`,
              change: 2.3,
              icon: Zap,
              color: 'text-green-400'
            },
            {
              label: 'Competitive Advantage',
              value: analyticsData.overview.competitiveAdvantage,
              change: -2.1,
              icon: AlertTriangle,
              color: 'text-orange-400'
            }
          ].map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
                <div className={`flex items-center gap-1 text-sm ${
                  metric.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {metric.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {formatPercentage(Math.abs(metric.change))}
                </div>
              </div>
              <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
              <p className="text-sm text-gray-400">{metric.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Discovery Trends Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 mb-8"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Discovery Trends Over Time
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.discoveryTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date" 
                  stroke="#9ca3af"
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                    border: '1px solid #8b5cf6', 
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <Line type="monotone" dataKey="companies" stroke="#8b5cf6" strokeWidth={2} name="Companies" />
                <Line type="monotone" dataKey="funding" stroke="#06b6d4" strokeWidth={2} name="Funding Events" />
                <Line type="monotone" dataKey="competitive" stroke="#f59e0b" strokeWidth={2} name="Competitive Intel" />
                <Line type="monotone" dataKey="market" stroke="#10b981" strokeWidth={2} name="Market Data" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Sector Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              Sector Distribution
            </h2>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.sectorDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.sectorDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {analyticsData.sectorDistribution.map((sector, index) => (
                <div key={sector.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{sector.name}</span>
                  </div>
                  <div className="text-gray-400">
                    {sector.count} companies • Avg: {sector.avgScore}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quality Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Quality Score Distribution
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.qualityDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="tier" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                      border: '1px solid #8b5cf6', 
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Funding Intelligence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 mb-8"
        >
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-400" />
            Funding Intelligence Trends
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.fundingTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                    border: '1px solid #8b5cf6', 
                    borderRadius: '8px',
                    color: 'white'
                  }}
                  formatter={(value, name) => {
                    if (name === 'amount') return [formatCurrency(value as number), 'Total Funding'];
                    if (name === 'deals') return [value, 'Number of Deals'];
                    if (name === 'avgDeal') return [formatCurrency(value as number), 'Avg Deal Size'];
                    return [value, name];
                  }}
                />
                <Bar dataKey="amount" fill="#8b5cf6" name="amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Competitive Threats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-purple-400" />
              Top Competitive Threats
            </h2>
            <div className="space-y-4">
              {analyticsData.competitiveThreats.map((threat, index) => (
                <div key={threat.company} className="flex items-center justify-between p-4 bg-red-600/10 border border-red-600/20 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-white">{threat.company}</h3>
                    <p className="text-sm text-gray-400">{threat.sector} • {threat.lastActivity}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-red-400 font-bold">{threat.threatScore}/100</div>
                    <div className="text-xs text-gray-400">Threat Score</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Strategic Opportunities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Top Strategic Opportunities
            </h2>
            <div className="space-y-4">
              {analyticsData.topOpportunities.map((opportunity, index) => (
                <div key={opportunity.name} className="flex items-center justify-between p-4 bg-green-600/10 border border-green-600/20 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{opportunity.name}</h3>
                    <p className="text-sm text-gray-400">{opportunity.sector} • {opportunity.stage}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">{opportunity.score}/100</div>
                    <div className="text-xs text-gray-400">Potential Score</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}