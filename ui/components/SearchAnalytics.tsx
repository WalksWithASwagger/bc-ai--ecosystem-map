'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  TrendingUp, 
  Clock, 
  Target, 
  Filter,
  BarChart3,
  Eye,
  Users,
  Activity
} from 'lucide-react';

interface SearchAnalytics {
  query: string;
  timestamp: number;
  resultsCount: number;
  filters: any;
  selectedSuggestion?: any;
}

interface SearchAnalyticsProps {
  analytics: SearchAnalytics[];
  isVisible: boolean;
  onToggle: () => void;
}

interface SearchInsight {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  trend?: number;
}

export default function SearchAnalytics({ analytics, isVisible, onToggle }: SearchAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week'>('hour');

  // Filter analytics by time range
  const filteredAnalytics = useMemo(() => {
    const now = Date.now();
    const timeRanges = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
    };
    
    const cutoff = now - timeRanges[timeRange];
    return analytics.filter(event => event.timestamp >= cutoff);
  }, [analytics, timeRange]);

  // Calculate insights
  const insights = useMemo(() => {
    if (filteredAnalytics.length === 0) {
      return [];
    }

    const totalSearches = filteredAnalytics.length;
    const uniqueQueries = new Set(filteredAnalytics.map(a => a.query.toLowerCase().trim())).size;
    const averageResults = Math.round(
      filteredAnalytics.reduce((sum, a) => sum + a.resultsCount, 0) / totalSearches
    );
    
    // Most popular queries
    const queryCounts = filteredAnalytics.reduce((acc, a) => {
      const query = a.query.toLowerCase().trim();
      if (query.length > 0) {
        acc[query] = (acc[query] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const topQuery = Object.entries(queryCounts)
      .sort(([,a], [,b]) => b - a)[0];

    // Filter usage
    const filtersUsed = filteredAnalytics.filter(a => 
      Object.values(a.filters || {}).some(v => v !== 'all' && v !== 0 && v !== false)
    ).length;
    
    const filterUsageRate = Math.round((filtersUsed / totalSearches) * 100);

    // Zero results searches
    const zeroResultsCount = filteredAnalytics.filter(a => a.resultsCount === 0).length;
    const zeroResultsRate = Math.round((zeroResultsCount / totalSearches) * 100);

    const insightData: SearchInsight[] = [
      {
        label: 'Total Searches',
        value: totalSearches,
        icon: Search,
        color: 'text-ai-electric-400',
      },
      {
        label: 'Unique Queries',
        value: uniqueQueries,
        icon: Users,
        color: 'text-ai-neon-400',
      },
      {
        label: 'Avg Results',
        value: averageResults,
        icon: Target,
        color: 'text-ai-emerald-400',
      },
      {
        label: 'Filter Usage',
        value: `${filterUsageRate}%`,
        icon: Filter,
        color: 'text-ai-amber-400',
      },
      {
        label: 'Zero Results',
        value: `${zeroResultsRate}%`,
        icon: Eye,
        color: zeroResultsRate > 20 ? 'text-red-400' : 'text-gray-400',
      },
    ];

    if (topQuery) {
      insightData.push({
        label: 'Top Query',
        value: `"${topQuery[0]}" (${topQuery[1]}x)`,
        icon: TrendingUp,
        color: 'text-purple-400',
      });
    }

    return insightData;
  }, [filteredAnalytics]);

  // Recent searches
  const recentSearches = useMemo(() => {
    return filteredAnalytics
      .slice(-10)
      .reverse()
      .map(event => ({
        ...event,
        timeAgo: getTimeAgo(event.timestamp),
      }));
  }, [filteredAnalytics]);

  // Popular queries
  const popularQueries = useMemo(() => {
    const queryCounts = filteredAnalytics.reduce((acc, a) => {
      const query = a.query.toLowerCase().trim();
      if (query.length > 1) {
        acc[query] = (acc[query] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(queryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([query, count]) => ({ query, count }));
  }, [filteredAnalytics]);

  function getTimeAgo(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  if (!isVisible) {
    return (
      <motion.button
        onClick={onToggle}
        className="fixed bottom-6 right-6 p-3 bg-ai-electric-500 text-white rounded-xl shadow-lg hover:shadow-ai-glow transition-all duration-300 z-40"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Activity className="w-5 h-5" />
      </motion.button>
    );
  }

  return (
    <motion.div
      className="fixed bottom-6 right-6 w-96 max-h-[70vh] bg-white/95 dark:bg-ai-dark-200/95 backdrop-blur-xl border border-white/20 dark:border-ai-dark-300/30 rounded-2xl shadow-2xl overflow-hidden z-40"
      initial={{ opacity: 0, y: 100, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 100, scale: 0.9 }}
      transition={{ duration: 0.3, type: "spring" as const, damping: 25, stiffness: 120 }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-ai-dark-300/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-ai-electric-400/20">
              <BarChart3 className="w-4 h-4 text-ai-electric-500" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Search Analytics</h3>
          </div>
          <button
            onClick={onToggle}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-ai-dark-300/30 transition-colors"
          >
            <Eye className="w-4 h-4 text-gray-500 dark:text-ai-dark-400" />
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-1">
          {(['hour', 'day', 'week'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200 ${
                timeRange === range
                  ? 'bg-ai-electric-500 text-white'
                  : 'bg-gray-100 dark:bg-ai-dark-300/30 text-gray-600 dark:text-ai-dark-400 hover:bg-ai-electric-100'
              }`}
            >
              Last {range}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto max-h-[calc(70vh-120px)]">
        {filteredAnalytics.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-ai-dark-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No search activity in the last {timeRange}</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Key Insights */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-ai-dark-400 mb-2">Key Insights</h4>
              <div className="grid grid-cols-2 gap-2">
                {insights.map((insight, index) => {
                  const Icon = insight.icon;
                  return (
                    <motion.div
                      key={insight.label}
                      className="p-3 bg-gradient-to-br from-white/50 to-gray-50/50 dark:from-ai-dark-300/20 dark:to-ai-dark-300/30 rounded-lg"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-3 h-3 ${insight.color}`} />
                        <span className="text-xs font-medium text-gray-600 dark:text-ai-dark-400">
                          {insight.label}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {insight.value}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Popular Queries */}
            {popularQueries.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-ai-dark-400 mb-2">Popular Queries</h4>
                <div className="space-y-1">
                  {popularQueries.map((item, index) => (
                    <motion.div
                      key={item.query}
                      className="flex items-center justify-between p-2 bg-gradient-to-r from-ai-electric-400/5 to-ai-neon-400/5 rounded-lg"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <span className="text-xs text-gray-700 dark:text-ai-dark-400 truncate">
                        "{item.query}"
                      </span>
                      <span className="text-xs font-medium text-ai-electric-600 dark:text-ai-electric-400">
                        {item.count}x
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Searches */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-ai-dark-400 mb-2">Recent Activity</h4>
              <div className="space-y-2">
                {recentSearches.map((search, index) => (
                  <motion.div
                    key={`${search.query}-${search.timestamp}`}
                    className="flex items-center justify-between p-2 bg-white/50 dark:bg-ai-dark-300/20 rounded-lg"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-900 dark:text-white truncate">
                        {search.query || <span className="italic text-gray-400">Empty search</span>}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-ai-dark-400">
                        <Target className="w-3 h-3" />
                        {search.resultsCount} results
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-ai-dark-500">
                      <Clock className="w-3 h-3" />
                      {search.timeAgo}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
} 