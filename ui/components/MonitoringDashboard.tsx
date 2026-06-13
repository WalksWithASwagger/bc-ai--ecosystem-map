'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Clock, 
  Eye, 
  Search, 
  TrendingUp, 
  Users,
  Zap,
  X
} from 'lucide-react';
import { performanceMonitor, userAnalytics } from '../lib/monitoring';
import { useTheme } from '../contexts/ThemeContext';

interface MonitoringDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MonitoringDashboard({ isOpen, onClose }: MonitoringDashboardProps) {
  const { theme } = useTheme();
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [errorData, setErrorData] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Initial load
      refreshData();
      
      // Set up auto-refresh every 5 seconds
      const interval = setInterval(refreshData, 5000);
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [isOpen]);

  const refreshData = () => {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') return;
      
      const perfSummary = performanceMonitor.getPerformanceSummary();
      const sessionSummary = userAnalytics.getSessionSummary();
      const errorSummary = performanceMonitor.getErrorSummary();
      
      setPerformanceData(perfSummary || {});
      setSessionData(sessionSummary || {});
      setErrorData(errorSummary || { total: 0, lastHour: 0, lastDay: 0 });
    } catch (error) {
      console.error('Error refreshing monitoring data:', error);
      // Set fallback data to prevent UI crashes
      setPerformanceData({});
      setSessionData({});
      setErrorData({ total: 0, lastHour: 0, lastDay: 0 });
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getPerformanceStatus = (metric: string, value: number) => {
    const thresholds: Record<string, { good: number; needs_improvement: number }> = {
      LCP: { good: 2500, needs_improvement: 4000 },
      FID: { good: 100, needs_improvement: 300 },
      CLS: { good: 0.1, needs_improvement: 0.25 },
      search_duration: { good: 500, needs_improvement: 1000 }
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.needs_improvement) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-400';
      case 'needs-improvement': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-400/20';
      case 'needs-improvement': return 'bg-yellow-400/20';
      case 'poor': return 'bg-red-400/20';
      default: return 'bg-gray-400/20';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-black/90 backdrop-blur-md border border-cyber-border rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-neon-blue" />
              <h2 className="text-2xl font-bold text-neon-blue font-mono">
                MONITORING.DASHBOARD
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg border border-cyber-border hover:bg-cyber-border/20 transition-colors"
            >
              <X className="w-5 h-5 text-terminal-gray" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Core Web Vitals */}
            <div className="bg-black/50 border border-cyber-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-neon-green" />
                <h3 className="text-lg font-semibold text-neon-green font-mono">
                  Core Web Vitals
                </h3>
              </div>
              
              {performanceData && (
                <div className="space-y-3">
                  {['LCP', 'FID', 'CLS'].map((metric) => {
                    const data = performanceData[metric];
                    if (!data) return null;
                    
                    const status = getPerformanceStatus(metric, data.average);
                    
                    return (
                      <div key={metric} className="flex items-center justify-between">
                        <span className="text-terminal-gray font-mono text-sm">
                          {metric}:
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-sm ${getStatusColor(status)}`}>
                            {metric === 'CLS' 
                              ? data.average.toFixed(3)
                              : `${Math.round(data.average)}${metric === 'LCP' ? 'ms' : 'ms'}`
                            }
                          </span>
                          <div className={`w-2 h-2 rounded-full ${getStatusBg(status)}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Search Performance */}
            <div className="bg-black/50 border border-cyber-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5 text-neon-blue" />
                <h3 className="text-lg font-semibold text-neon-blue font-mono">
                  Search Performance
                </h3>
              </div>
              
              {performanceData?.search_duration && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-terminal-gray font-mono text-sm">Avg Response:</span>
                    <span className="text-neon-blue font-mono text-sm">
                      {Math.round(performanceData.search_duration.average)}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-terminal-gray font-mono text-sm">P95:</span>
                    <span className="text-neon-blue font-mono text-sm">
                      {Math.round(performanceData.search_duration.p95)}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-terminal-gray font-mono text-sm">Total Searches:</span>
                    <span className="text-neon-blue font-mono text-sm">
                      {performanceData.search_duration.count}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Session Analytics */}
            <div className="bg-black/50 border border-cyber-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-neon-purple" />
                <h3 className="text-lg font-semibold text-neon-purple font-mono">
                  Session Data
                </h3>
              </div>
              
              {sessionData && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-terminal-gray font-mono text-sm">Duration:</span>
                    <span className="text-neon-purple font-mono text-sm">
                      {formatDuration(sessionData.sessionDuration)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-terminal-gray font-mono text-sm">Page Views:</span>
                    <span className="text-neon-purple font-mono text-sm">
                      {sessionData.pageViews}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-terminal-gray font-mono text-sm">Searches:</span>
                    <span className="text-neon-purple font-mono text-sm">
                      {sessionData.searchCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-terminal-gray font-mono text-sm">Org Views:</span>
                    <span className="text-neon-purple font-mono text-sm">
                      {sessionData.organizationViews}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Error Tracking */}
            <div className="bg-black/50 border border-cyber-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-semibold text-red-400 font-mono">
                  Error Tracking
                </h3>
              </div>
              
              {errorData && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-terminal-gray font-mono text-sm">Total Errors:</span>
                    <span className="text-red-400 font-mono text-sm">
                      {errorData.total}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-terminal-gray font-mono text-sm">Last 24h:</span>
                    <span className="text-red-400 font-mono text-sm">
                      {errorData.last24h}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-terminal-gray font-mono text-sm">Last Hour:</span>
                    <span className="text-red-400 font-mono text-sm">
                      {errorData.lastHour}
                    </span>
                  </div>
                  
                  {errorData.recent && errorData.recent.length > 0 && (
                    <div className="mt-4">
                      <p className="text-terminal-gray font-mono text-xs mb-2">Recent Errors:</p>
                      <div className="space-y-1 max-h-20 overflow-y-auto">
                        {errorData.recent.map((error: any, index: number) => (
                          <div key={index} className="text-red-300 font-mono text-xs truncate">
                            {error.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* API Performance */}
            {performanceData && Object.keys(performanceData).some(key => key.startsWith('api_')) && (
              <div className="bg-black/50 border border-cyber-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-neon-green" />
                  <h3 className="text-lg font-semibold text-neon-green font-mono">
                    API Performance
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {Object.entries(performanceData)
                    .filter(([key]) => key.startsWith('api_'))
                    .map(([key, data]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-terminal-gray font-mono text-xs">
                          {key.replace('api_', '').replace(/_/g, '/')}:
                        </span>
                        <span className="text-neon-green font-mono text-xs">
                          {Math.round(data.average)}ms
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Real-time Status */}
            <div className="bg-black/50 border border-cyber-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-neon-blue" />
                <h3 className="text-lg font-semibold text-neon-blue font-mono">
                  Live Status
                </h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-terminal-gray font-mono text-sm">System:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-neon-green font-mono text-sm">Online</span>
                    <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-terminal-gray font-mono text-sm">Last Update:</span>
                  <span className="text-neon-blue font-mono text-sm">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-terminal-gray font-mono text-sm">Monitoring:</span>
                  <span className="text-neon-green font-mono text-sm">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-cyber-border">
            <p className="text-terminal-gray font-mono text-xs text-center">
              Monitoring dashboard updates every 5 seconds • Press ESC to close
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}