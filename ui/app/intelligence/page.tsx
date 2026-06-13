'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../../components/ThemeToggle';
import { 
  TrendingUp, 
  DollarSign, 
  MapPin, 
  Trophy, 
  Zap, 
  Target, 
  ArrowRight,
  Calendar,
  Users,
  Building2,
  Lightbulb,
  Award,
  Star,
  ChevronRight,
  Activity,
  BarChart3
} from 'lucide-react';

import { IntelligenceEngine, type IndustryGrowthData, type FundingInsight, type GeographicCluster, type LeaderboardEntry, type EcosystemInsight } from '../../lib/intelligence-engine';
import IntelligenceVisualizations from '../../components/IntelligenceVisualizations';
import type { Organization, Stats } from '../../types';
import { userAnalytics } from '../../lib/monitoring';

export default function IntelligencePage() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'growth' | 'funding' | 'clusters' | 'leaderboards'>('overview');
  const [engine, setEngine] = useState<IntelligenceEngine | null>(null);
  const [insights, setInsights] = useState<EcosystemInsight[]>([]);
  const [growthData, setGrowthData] = useState<IndustryGrowthData[]>([]);
  const [fundingData, setFundingData] = useState<FundingInsight[]>([]);
  const [clusterData, setClusterData] = useState<GeographicCluster[]>([]);
  const [leaderboards, setLeaderboards] = useState<Record<string, LeaderboardEntry[]>>({});
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    // Track page view
    userAnalytics.trackPageView('/intelligence');
    
    // Always fetch organizations since this is a standalone page
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      const data = await response.json();
      if (data.organizations) {
        setOrganizations(data.organizations);
        processData(data.organizations);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const processData = (orgs: Organization[]) => {
    setLoading(true);
    
    // Create intelligence engine
    const intelligenceEngine = new IntelligenceEngine(orgs);
    setEngine(intelligenceEngine);
    
    // Generate all analytics
    const ecosystemInsights = intelligenceEngine.generateInsights();
    const industryGrowth = intelligenceEngine.analyzeIndustryGrowth();
    const fundingActivity = intelligenceEngine.analyzeFundingActivity();
    const geoClusters = intelligenceEngine.analyzeGeographicClusters();
    const boardData = intelligenceEngine.generateLeaderboards();
    
    setInsights(ecosystemInsights);
    setGrowthData(industryGrowth);
    setFundingData(fundingActivity);
    setClusterData(geoClusters);
    setLeaderboards(boardData);
    
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'low': return 'text-green-400 bg-green-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'growth': return <TrendingUp className="w-4 h-4" />;
      case 'funding': return <DollarSign className="w-4 h-4" />;
      case 'cluster': return <MapPin className="w-4 h-4" />;
      case 'trend': return <Zap className="w-4 h-4" />;
      case 'opportunity': return <Target className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`
        min-h-screen flex items-center justify-center transition-all duration-700
        ${theme === 'dark' ? 'aurora-bg' : 'zen-bg'}
      `}>
        <div className="text-center">
          <div className={`
            w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4
            ${theme === 'dark' ? 'border-cyan-400' : 'border-blue-600'}
          `}></div>
          <p className={`font-mono ${theme === 'dark' ? 'text-cyan-300' : 'text-gray-700'}`}>
            {theme === 'dark' ? 'Analyzing aurora intelligence...' : 'Processing ecosystem data...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      min-h-screen transition-all duration-700
      ${theme === 'dark' ? 'aurora-bg' : 'zen-bg'}
    `}>
      {/* Header */}
      <div className="border-b border-cyber-border bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-4xl font-bold text-neon-blue font-mono mb-2">
                ECOSYSTEM.INTELLIGENCE
              </h1>
              <p className="text-terminal-gray">
                Advanced analytics and insights from BC's AI ecosystem data
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-neon-green font-mono">
                  {organizations.length}
                </div>
                <div className="text-xs text-terminal-gray font-mono">
                  ORGANIZATIONS ANALYZED
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-cyber-border bg-black/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-8">
            {[
              { id: 'overview', label: 'OVERVIEW', icon: Activity },
              { id: 'growth', label: 'GROWTH TRENDS', icon: TrendingUp },
              { id: 'funding', label: 'FUNDING INTEL', icon: DollarSign },
              { id: 'clusters', label: 'GEO CLUSTERS', icon: MapPin },
              { id: 'leaderboards', label: 'LEADERBOARDS', icon: Trophy }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id as any);
                  userAnalytics.trackInteraction('intelligence_tab_change', { tab: id });
                }}
                className={`flex items-center gap-2 px-4 py-4 font-mono text-sm transition-all duration-300 border-b-2 ${
                  activeTab === id
                    ? 'text-neon-blue border-neon-blue bg-neon-blue/10'
                    : 'text-terminal-gray border-transparent hover:text-neon-blue hover:border-neon-blue/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Key Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-black/50 border border-cyber-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Lightbulb className="w-6 h-6 text-neon-yellow" />
                    <h2 className="text-xl font-bold text-neon-yellow font-mono">
                      KEY INSIGHTS
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    {insights.slice(0, 4).map((insight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-black/30 border border-cyber-border/50 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getTypeIcon(insight.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-white">
                                {insight.title}
                              </h3>
                              <span className={`px-2 py-1 rounded text-xs font-mono ${getPriorityColor(insight.priority)}`}>
                                {insight.priority.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-terminal-gray text-sm">
                              {insight.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="text-xs text-neon-blue font-mono">
                                Confidence: {Math.round(insight.confidence * 100)}%
                              </div>
                              {insight.actionable && (
                                <div className="text-xs text-neon-green font-mono">
                                  ACTIONABLE
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-black/50 border border-cyber-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <BarChart3 className="w-6 h-6 text-neon-green" />
                    <h2 className="text-xl font-bold text-neon-green font-mono">
                      ECOSYSTEM SNAPSHOT
                    </h2>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/30 border border-cyber-border/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-neon-blue font-mono mb-1">
                        {growthData.length}
                      </div>
                      <div className="text-xs text-terminal-gray font-mono">
                        ACTIVE SECTORS
                      </div>
                    </div>
                    
                    <div className="bg-black/30 border border-cyber-border/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-neon-purple font-mono mb-1">
                        {clusterData.length}
                      </div>
                      <div className="text-xs text-terminal-gray font-mono">
                        MAJOR CLUSTERS
                      </div>
                    </div>
                    
                    <div className="bg-black/30 border border-cyber-border/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-neon-yellow font-mono mb-1">
                        {fundingData.filter(f => f.lastActivity === 'Recent').length}
                      </div>
                      <div className="text-xs text-terminal-gray font-mono">
                        RECENT FUNDING
                      </div>
                    </div>
                    
                    <div className="bg-black/30 border border-cyber-border/50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-neon-pink font-mono mb-1">
                        {organizations.filter(org => org.yearFounded && (new Date().getFullYear() - org.yearFounded) <= 3).length}
                      </div>
                      <div className="text-xs text-terminal-gray font-mono">
                        EMERGING ORGS
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Visualizations */}
              <IntelligenceVisualizations 
                growthData={growthData}
                clusterData={clusterData}
                fundingData={fundingData}
              />
            </motion.div>
          )}

          {/* Add other tab content here - Growth, Funding, Clusters, Leaderboards */}
          {/* For now, I'll add placeholders that we can expand */}
          
          {activeTab === 'growth' && (
            <motion.div
              key="growth"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-black/50 border border-cyber-border rounded-xl p-6">
                <h2 className="text-2xl font-bold text-neon-pink font-mono mb-6">
                  INDUSTRY GROWTH ANALYSIS
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {growthData.map((sector, index) => (
                    <motion.div
                      key={sector.category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-black/30 border border-cyber-border/50 rounded-lg p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white">
                          {sector.category}
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-neon-pink rounded-full animate-pulse" />
                          <span className="text-neon-pink font-mono text-lg font-bold">
                            {sector.hotness}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-terminal-gray text-sm">Growth Rate</span>
                          <span className="text-neon-green font-mono font-bold">
                            {sector.growthRate.toFixed(1)}%
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-terminal-gray text-sm">Total Organizations</span>
                          <span className="text-neon-blue font-mono">
                            {sector.organizations.length}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-terminal-gray text-sm">Recent Additions</span>
                          <span className="text-neon-yellow font-mono">
                            {sector.recentAdditions}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-terminal-gray text-sm">Est. Total Funding</span>
                          <span className="text-neon-purple font-mono">
                            {formatCurrency(sector.totalFunding)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-terminal-gray text-sm">Avg Age</span>
                          <span className="text-terminal-gray font-mono">
                            {sector.averageAge.toFixed(1)} years
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Growth Visualizations */}
              <div className="bg-black/50 border border-cyber-border rounded-xl p-6">
                <h2 className="text-xl font-bold text-neon-pink font-mono mb-6">
                  GROWTH TREND VISUALIZATIONS
                </h2>
                <IntelligenceVisualizations 
                  growthData={growthData}
                  clusterData={clusterData.slice(0, 5)}
                  fundingData={fundingData.slice(0, 10)}
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'funding' && (
            <motion.div
              key="funding"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-black/50 border border-cyber-border rounded-xl p-6">
                <h2 className="text-2xl font-bold text-neon-green font-mono mb-6">
                  FUNDING INTELLIGENCE
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {fundingData.slice(0, 12).map((funding, index) => (
                    <motion.div
                      key={funding.organization.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-black/30 border border-cyber-border/50 rounded-lg p-4"
                    >
                      <div className="mb-3">
                        <h3 className="font-bold text-white mb-1 truncate">
                          {funding.organization.name}
                        </h3>
                        <p className="text-xs text-terminal-gray">
                          {funding.organization.category}
                        </p>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-terminal-gray">Est. Funding:</span>
                          <span className="text-neon-green font-mono font-bold">
                            {formatCurrency(funding.estimatedFunding)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-terminal-gray">Stage:</span>
                          <span className="text-neon-blue font-mono">
                            {funding.fundingStage}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-terminal-gray">Activity:</span>
                          <span className={`font-mono ${
                            funding.lastActivity === 'Recent' ? 'text-neon-yellow' : 'text-terminal-gray'
                          }`}>
                            {funding.lastActivity}
                          </span>
                        </div>
                        
                        {funding.growthIndicators.length > 0 && (
                          <div className="mt-3">
                            <div className="text-xs text-terminal-gray mb-1">Growth Indicators:</div>
                            <div className="flex flex-wrap gap-1">
                              {funding.growthIndicators.slice(0, 2).map((indicator, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-neon-purple/20 text-neon-purple text-xs rounded font-mono"
                                >
                                  {indicator}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'clusters' && (
            <motion.div
              key="clusters"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-black/50 border border-cyber-border rounded-xl p-6">
                <h2 className="text-2xl font-bold text-neon-blue font-mono mb-6">
                  GEOGRAPHIC CLUSTERS
                </h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {clusterData.map((cluster, index) => (
                    <motion.div
                      key={`${cluster.region}-${cluster.city}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-black/30 border border-cyber-border/50 rounded-lg p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-bold text-white text-lg">
                            {cluster.city}
                          </h3>
                          <p className="text-terminal-gray text-sm">
                            {cluster.region}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-neon-blue font-mono">
                            {cluster.clusterStrength}
                          </div>
                          <div className="text-xs text-terminal-gray font-mono">
                            STRENGTH
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-terminal-gray">Organizations:</span>
                          <span className="text-neon-green font-mono font-bold">
                            {cluster.density}
                          </span>
                        </div>
                        
                        <div>
                          <div className="text-terminal-gray text-sm mb-2">Dominant Categories:</div>
                          <div className="flex flex-wrap gap-1">
                            {cluster.dominantCategories.map((category, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 bg-neon-purple/20 text-neon-purple text-xs rounded font-mono"
                              >
                                {category}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {cluster.emergingTrends.length > 0 && (
                          <div>
                            <div className="text-terminal-gray text-sm mb-2">Emerging Trends:</div>
                            <div className="flex flex-wrap gap-1">
                              {cluster.emergingTrends.map((trend, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-neon-yellow/20 text-neon-yellow text-xs rounded font-mono"
                                >
                                  {trend}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'leaderboards' && (
            <motion.div
              key="leaderboards"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {Object.entries(leaderboards).map(([boardName, entries]) => (
                <div key={boardName} className="bg-black/50 border border-cyber-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Trophy className="w-6 h-6 text-neon-yellow" />
                    <h2 className="text-xl font-bold text-neon-yellow font-mono">
                      {boardName.toUpperCase()} LEADERBOARD
                    </h2>
                  </div>
                  
                  <div className="space-y-3">
                    {entries.map((entry, index) => (
                      <motion.div
                        key={entry.organization.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          index < 3 
                            ? 'bg-gradient-to-r from-neon-yellow/10 to-transparent border-neon-yellow/30' 
                            : 'bg-black/30 border-cyber-border/50'
                        }`}
                      >
                        <div className="flex-shrink-0 w-8 text-center">
                          {index < 3 ? (
                            <Award className={`w-6 h-6 mx-auto ${
                              index === 0 ? 'text-yellow-400' : 
                              index === 1 ? 'text-gray-300' : 'text-amber-600'
                            }`} />
                          ) : (
                            <span className="text-terminal-gray font-mono font-bold">
                              #{entry.rank}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-white">
                              {entry.organization.name}
                            </h3>
                            <span className="text-neon-blue font-mono font-bold">
                              {boardName === 'funding' ? formatCurrency(entry.score) : entry.score}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-terminal-gray">
                              {entry.organization.category}
                            </span>
                            {entry.insights.length > 0 && (
                              <>
                                <span className="text-terminal-gray">•</span>
                                <div className="flex gap-1">
                                  {entry.insights.slice(0, 2).map((insight, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-1 bg-neon-green/20 text-neon-green text-xs rounded font-mono"
                                    >
                                      {insight}
                                    </span>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <ChevronRight className="w-4 h-4 text-terminal-gray flex-shrink-0" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}