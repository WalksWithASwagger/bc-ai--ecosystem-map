'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, BarChart3, Filter, Terminal, Zap, Globe, Users, Building, Mail, Activity } from 'lucide-react';

import ThemeToggle from '../components/ThemeToggle';
import OrganizationModal from '../components/OrganizationModal';
import AdvancedSearch from '../components/AdvancedSearch';
import SearchAnalytics from '../components/SearchAnalytics';
import MonitoringDashboard from '../components/MonitoringDashboard';
import MonitoringStatus from '../components/MonitoringStatus';
import { useSearch } from '../hooks/useSearch';
import { initializeMonitoring, performanceMonitor, userAnalytics } from '../lib/monitoring';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../lib/design-system';
import type { Organization, Stats } from '../types';
import DataVisualizations from '../components/DataVisualizations';
import { getCategoryColor } from '../utils/categoryColors';
import GlitchText from '../components/GlitchText';
import ScanlineEffect from '../components/ScanlineEffect';

// Map components with error handling
import MapFallback from '../components/MapFallback';
import ErrorBoundary from '../components/ErrorBoundary';

const InteractiveMap = dynamic(() => import('../components/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center border border-cyber-border">
      <div className="text-terminal-gray font-mono text-sm animate-pulse">initializing map.module...</div>
    </div>
  ),
});

// Types imported from '../types'

export default function Home() {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [modalOrganization, setModalOrganization] = useState<Organization | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [loadTime, setLoadTime] = useState<number | null>(null);

  // Use the advanced search hook
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    filteredOrganizations,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    selectSuggestion,
    clearSearch,
    analytics
  } = useSearch(organizations);

  const fetchOrganizations = useCallback(async () => {
    if (hasFetched.current) return; // Prevent multiple calls
    hasFetched.current = true;
    
    const startTime = performance.now();
    
    try {
      const response = await fetch('/api/organizations');
      const data = await response.json();
      
      // Track API performance
      performanceMonitor.trackAPICall('/api/organizations', startTime, true);
      
      const finalLoadTime = performance.now() - startTime;
      setLoadTime(finalLoadTime);
      setOrganizations(data.organizations || []);
      setStats(data.stats);
      setLoading(false);
      
      // Track successful data load
      userAnalytics.trackInteraction('data_loaded', {
        organizationCount: data.organizations?.length || 0,
        loadTime: finalLoadTime
      });
    } catch (error) {
      console.error('Error fetching organizations:', error);
      
      // Track API error
      performanceMonitor.trackAPICall('/api/organizations', startTime, false, error as Error);
      performanceMonitor.recordError(error as Error, { context: 'fetchOrganizations' });
      
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrganizations();
    
    // Initialize monitoring system
    initializeMonitoring();
    
    // Track initial page view
    userAnalytics.trackPageView('/');
  }, [fetchOrganizations]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading BC AI Ecosystem...</div>
      </div>
    );
  }

  return (
    <main className={`
      min-h-screen overflow-x-hidden relative transition-all duration-700
      ${theme === 'dark' 
        ? 'aurora-bg text-white' 
        : 'zen-bg text-gray-900'
      }
    `}>
      {/* Theme-aware background effects */}
      {theme === 'dark' ? (
        <>
          <div className="fixed inset-0 opacity-20 pointer-events-none z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-gradient-x"></div>
          </div>
          <div className="fixed inset-0 bg-gradient-to-t from-transparent via-transparent to-cyan-400/5 pointer-events-none z-0 animate-aurora-wave"></div>
        </>
      ) : (
        <>
          <div className="fixed inset-0 opacity-30 pointer-events-none z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/50 to-slate-50/50 animate-gradient-x"></div>
          </div>
          <div className="fixed inset-0 bg-gradient-to-t from-transparent via-transparent to-blue-100/10 pointer-events-none z-0"></div>
        </>
      )}
      
      {/* Subtle scanline effect */}
      <ScanlineEffect opacity={0.02} speed={12} />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Terminal Header */}
        <motion.header 
          className="mb-16 relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Theme-aware Header Window */}
          <div className={`
            backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl transition-all duration-500
            ${theme === 'dark' 
              ? 'glass-dark shadow-cyan-400/20' 
              : 'glass-light shadow-gray-300/30'
            }
          `}>
            {/* Header Title Bar */}
            <div className={`
              flex items-center justify-between px-6 py-4 border-b backdrop-blur-md transition-all duration-300
              ${theme === 'dark' 
                ? 'bg-gradient-to-r from-black/50 to-purple-900/30 border-cyan-500/20' 
                : 'bg-gradient-to-r from-white/60 to-blue-50/40 border-gray-200/50'
              }
            `}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full shadow-sm ${theme === 'dark' ? 'bg-red-400' : 'bg-red-500'}`}></div>
                <div className={`w-3 h-3 rounded-full shadow-sm ${theme === 'dark' ? 'bg-yellow-400' : 'bg-yellow-500'}`}></div>
                <div className={`w-3 h-3 rounded-full shadow-sm animate-pulse ${theme === 'dark' ? 'bg-cyan-400' : 'bg-green-500'}`}></div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`text-sm font-mono opacity-60 ${theme === 'dark' ? 'text-cyan-300' : 'text-gray-600'}`}>
                  {theme === 'dark' ? 'aurora.ecosystem.terminal' : 'zen.ecosystem.interface'}
                </div>
                <MonitoringStatus />
              </div>
              <ThemeToggle />
            </div>
            
            {/* Terminal Content */}
            <div className="p-8">
              <motion.div
                className="flex items-center gap-6 mb-8"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <motion.div 
                  className={`
                    p-4 rounded-xl backdrop-blur-sm transition-all duration-300 animate-float
                    ${theme === 'dark' 
                      ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-400/30 animate-glow-pulse' 
                      : 'bg-gradient-to-br from-blue-100/80 to-indigo-100/60 border border-blue-200/50 hover:shadow-lg'
                    }
                  `}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                >
                  <Terminal className={`w-10 h-10 filter drop-shadow-sm ${theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`} />
                </motion.div>
                <div>
                  <h1 className={`
                    text-4xl md:text-5xl font-bold transition-all duration-300
                    ${theme === 'dark' 
                      ? 'text-gradient-aurora' 
                      : 'text-gradient-zen'
                    }
                  `}>
                    {theme === 'dark' ? (
                      <GlitchText 
                        text="BC.AI_ECOSYSTEM" 
                        glitchProbability={0.003}
                        glitchDuration={100}
                      />
                    ) : (
                      <span className="animate-shimmer">BC AI ECOSYSTEM</span>
                    )}
                    <span className={`animate-blink ${theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`}>_</span>
                  </h1>
                  <motion.div
                    className={`text-sm mt-3 font-mono tracking-wide transition-colors duration-300 ${
                      theme === 'dark' ? 'text-cyan-300/80' : 'text-gray-600'
                    }`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  >
                    {theme === 'dark' 
                      ? '$ initializing aurora.intelligence.protocol' 
                      : '› activating zen.ecosystem.interface'
                    }
                    <span className={`animate-terminal-cursor ml-2 ${theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`}>|</span>
                  </motion.div>
                </div>
              </motion.div>
              
              <motion.div 
                className={`font-mono text-sm space-y-2 transition-colors duration-300 ${
                  theme === 'dark' ? 'text-slate-300/80' : 'text-gray-600'
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.5 }}
              >
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`}>
                    {theme === 'dark' ? 'λ' : '›'}
                  </span>
                  <span className="opacity-70">
                    {theme === 'dark' 
                      ? 'scanning aurora intelligence networks...' 
                      : 'analyzing ecosystem connections...'
                    }
                  </span>
                  <div className={`ml-auto text-xs ${theme === 'dark' ? 'text-cyan-400' : 'text-green-600'}`}>
                    [COMPLETE]
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-indigo-600'}`}>
                    {theme === 'dark' ? 'λ' : '›'}
                  </span>
                  <span className="opacity-70">entities detected:</span>
                  <span className={`font-bold ml-auto ${theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`}>
                    {organizations?.length || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${theme === 'dark' ? 'text-pink-400' : 'text-purple-600'}`}>
                    {theme === 'dark' ? 'λ' : '›'}
                  </span>
                  <span className="opacity-70">ecosystem status:</span>
                  <span className={`font-bold ml-auto animate-pulse ${theme === 'dark' ? 'text-cyan-400' : 'text-green-600'}`}>
                    ACTIVE
                  </span>
                </div>
                {loadTime && (
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${theme === 'dark' ? 'text-yellow-400' : 'text-orange-600'}`}>
                      {theme === 'dark' ? 'λ' : '›'}
                    </span>
                    <span className="opacity-70">load time:</span>
                    <span className={`font-bold ml-auto ${theme === 'dark' ? 'text-yellow-400' : 'text-orange-600'}`}>
                      {(loadTime / 1000).toFixed(2)}s
                    </span>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
          
          {/* Theme-aware ambient effects */}
          {theme === 'dark' ? (
            <>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-cyan-400/10 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-purple-400/10 rounded-full blur-2xl animate-float"></div>
              <div className="absolute top-1/2 -right-8 w-2 h-16 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent blur-sm animate-pulse"></div>
            </>
          ) : (
            <>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-200/20 rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-indigo-200/20 rounded-full blur-2xl animate-float"></div>
              <div className="absolute top-1/2 -right-8 w-2 h-16 bg-gradient-to-b from-transparent via-blue-300/30 to-transparent blur-sm animate-pulse"></div>
            </>
          )}
        </motion.header>

        {/* Terminal Stats Display */}
        {stats && (
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6, staggerChildren: 0.1 }}
          >
            <motion.div 
              className="bg-black/70 backdrop-blur-md p-6 rounded-xl border border-neon-green/20 hover:border-neon-green/50 hover:bg-black/80 transition-all duration-500 group relative overflow-hidden shadow-lg hover:shadow-neon-green/20"
              whileHover={{ y: -2, scale: 1.01 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-neon-green/10 border border-neon-green/30">
                  <Building className="w-4 h-4 text-neon-green" />
                </div>
                <div className="text-xs text-terminal-muted font-mono uppercase tracking-widest">Neural Network</div>
              </div>
              <div className="text-2xl font-bold text-neon-green font-mono mb-1 filter drop-shadow-sm">
                {organizations.length}
              </div>
              <div className="text-terminal-gray text-xs font-mono opacity-70">active entities</div>
              <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse shadow-neon-green"></div>
            </motion.div>
            <motion.div 
              className="bg-black/70 backdrop-blur-md p-6 rounded-xl border border-neon-blue/20 hover:border-neon-blue/50 hover:bg-black/80 transition-all duration-500 group relative overflow-hidden shadow-lg hover:shadow-neon-blue/20"
              whileHover={{ y: -2, scale: 1.01 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-neon-blue/10 border border-neon-blue/30">
                  <Globe className="w-4 h-4 text-neon-blue" />
                </div>
                <div className="text-xs text-terminal-muted font-mono uppercase tracking-widest">Web Interface</div>
              </div>
              <div className="text-2xl font-bold text-neon-blue font-mono mb-1 filter drop-shadow-sm">
                {stats.withWebsite}
              </div>
              <div className="text-terminal-gray text-xs font-mono opacity-70">online presence</div>
              <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-neon-blue rounded-full animate-pulse shadow-neon-blue"></div>
            </motion.div>
            <motion.div 
              className="bg-black/70 backdrop-blur-md p-6 rounded-xl border border-neon-pink/20 hover:border-neon-pink/50 hover:bg-black/80 transition-all duration-500 group relative overflow-hidden shadow-lg hover:shadow-neon-pink/20"
              whileHover={{ y: -2, scale: 1.01 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-neon-pink/10 border border-neon-pink/30">
                  <Users className="w-4 h-4 text-neon-pink" />
                </div>
                <div className="text-xs text-terminal-muted font-mono uppercase tracking-widest">Social Graph</div>
              </div>
              <div className="text-2xl font-bold text-neon-pink font-mono mb-1 filter drop-shadow-sm">
                {stats.withLinkedIn}
              </div>
              <div className="text-terminal-gray text-xs font-mono opacity-70">network nodes</div>
              <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-neon-pink rounded-full animate-pulse shadow-neon-pink"></div>
            </motion.div>
            <motion.div 
              className="bg-black/70 backdrop-blur-md p-6 rounded-xl border border-terminal-yellow/20 hover:border-terminal-yellow/50 hover:bg-black/80 transition-all duration-500 group relative overflow-hidden shadow-lg hover:shadow-[0_0_20px_rgba(255,189,46,0.2)]"
              whileHover={{ y: -2, scale: 1.01 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-terminal-yellow/10 border border-terminal-yellow/30">
                  <Mail className="w-4 h-4 text-terminal-yellow" />
                </div>
                <div className="text-xs text-terminal-muted font-mono uppercase tracking-widest">Communication</div>
              </div>
              <div className="text-2xl font-bold text-terminal-yellow font-mono mb-1 filter drop-shadow-sm">
                {stats.withEmail}
              </div>
              <div className="text-terminal-gray text-xs font-mono opacity-70">contact channels</div>
              <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-terminal-yellow rounded-full animate-pulse shadow-[0_0_10px_rgba(255,189,46,0.5)]"></div>
            </motion.div>
            <motion.div 
              className="bg-black/70 backdrop-blur-md p-6 rounded-xl border border-neon-green/20 hover:border-neon-green/50 hover:bg-black/80 transition-all duration-500 group relative overflow-hidden shadow-lg hover:shadow-neon-green/20"
              whileHover={{ y: -2, scale: 1.01 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-neon-green/10 border border-neon-green/30">
                  <MapPin className="w-4 h-4 text-neon-green" />
                </div>
                <div className="text-xs text-terminal-muted font-mono uppercase tracking-widest">Geographic Zones</div>
              </div>
              <div className="text-2xl font-bold text-neon-green font-mono mb-1 filter drop-shadow-sm">
                {Object.keys(stats.byRegion).length}
              </div>
              <div className="text-terminal-gray text-xs font-mono opacity-70">regional clusters</div>
              <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-neon-green rounded-full animate-pulse shadow-neon-green"></div>
            </motion.div>
          </motion.div>
        )}

        {/* Advanced Search Component */}
        <AdvancedSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filters={filters}
          setFilters={setFilters}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          selectSuggestion={selectSuggestion}
          clearSearch={clearSearch}
          resultsCount={filteredOrganizations.length}
          regionOptions={stats ? Object.keys(stats.byRegion).sort().map(region => ({
            value: region,
            label: region,
            count: stats.byRegion[region]
          })) : []}
          categoryOptions={stats ? Object.keys(stats.byCategory).sort().map(category => ({
            value: category,
            label: category,
            count: stats.byCategory[category]
          })) : []}
        />

        {/* Action Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row justify-center gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <motion.button
            onClick={() => setShowMap(!showMap)}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-black/50 backdrop-blur-md border border-neon-blue/30 text-neon-blue rounded-xl font-mono text-sm tracking-wide hover:border-neon-blue hover:bg-black/70 hover:shadow-neon-blue/20 transition-all duration-500 group"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <MapPin className="w-5 h-5 group-hover:animate-pulse" />
            <span>{showMap ? 'HIDE_MAP.MODULE' : 'LOAD_MAP.MODULE'}</span>
            <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse ml-auto"></div>
          </motion.button>
          <motion.button
            onClick={() => setShowCharts(!showCharts)}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-black/50 backdrop-blur-md border border-neon-pink/30 text-neon-pink rounded-xl font-mono text-sm tracking-wide hover:border-neon-pink hover:bg-black/70 hover:shadow-neon-pink/20 transition-all duration-500 group"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <BarChart3 className="w-5 h-5 group-hover:animate-pulse" />
            <span>{showCharts ? 'HIDE_ANALYTICS.MODULE' : 'LOAD_ANALYTICS.MODULE'}</span>
            <div className="w-2 h-2 bg-neon-pink rounded-full animate-pulse ml-auto"></div>
          </motion.button>

          <motion.button
            onClick={() => setShowMonitoring(true)}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-black/50 backdrop-blur-md border border-neon-green/30 text-neon-green rounded-xl font-mono text-sm tracking-wide hover:border-neon-green hover:bg-black/70 hover:shadow-neon-green/20 transition-all duration-500 group"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <Activity className="w-5 h-5 group-hover:animate-pulse" />
            <span>MONITOR.DASHBOARD</span>
            <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse ml-auto"></div>
          </motion.button>

          <motion.button
            onClick={() => window.open('/intelligence', '_blank')}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-black/50 backdrop-blur-md border border-neon-purple/30 text-neon-purple rounded-xl font-mono text-sm tracking-wide hover:border-neon-purple hover:bg-black/70 hover:shadow-neon-purple/20 transition-all duration-500 group"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            <Zap className="w-5 h-5 group-hover:animate-pulse" />
            <span>INTELLIGENCE.HUB</span>
            <div className="w-2 h-2 bg-neon-purple rounded-full animate-pulse ml-auto"></div>
          </motion.button>
        </motion.div>

        {showMap && (
          <motion.div 
            className="bg-black/70 backdrop-blur-md p-6 rounded-xl border border-cyber-border shadow-lg mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-6 h-6 text-neon-blue" />
              <h2 className="text-2xl font-bold text-neon-blue font-mono drop-shadow-neon-blue">MAP.VISUALIZATION</h2>
            </div>
            <div className="bg-black/30 rounded-lg p-1">
              <ErrorBoundary
                fallback={
                  <MapFallback
                    organizations={filteredOrganizations || []}
                    selectedOrganization={selectedOrganization}
                    onOrganizationClick={(org) => setSelectedOrganization(org)}
                  />
                }
              >
                <InteractiveMap
                  organizations={filteredOrganizations || []}
                  selectedOrganization={selectedOrganization}
                  onOrganizationClick={(org) => setSelectedOrganization(org)}
                />
              </ErrorBoundary>
            </div>
          </motion.div>
        )}

        {showCharts && (
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-black/90 backdrop-blur-sm p-6 rounded-lg border border-cyber-border mb-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-6 h-6 text-neon-blue" />
                <h2 className="text-2xl font-bold text-neon-blue font-mono drop-shadow-neon-blue">ANALYTICS.MODULE</h2>
              </div>
              <div className="text-terminal-gray font-mono text-sm">
                <span className="text-neon-green">&gt;</span> processing_dataset: <span className="text-neon-blue">{filteredOrganizations?.length || 0}</span> entities
              </div>
            </div>
            <ErrorBoundary>
              <DataVisualizations organizations={filteredOrganizations || []} />
            </ErrorBoundary>
          </motion.div>
        )}

        {filteredOrganizations && filteredOrganizations.length === 0 && (
          <motion.div 
            className="mt-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex flex-col items-center p-8 bg-black/50 backdrop-blur-sm rounded-xl border border-terminal-yellow/30">
              <div className="w-16 h-16 mb-4 rounded-full bg-terminal-yellow/10 flex items-center justify-center">
                <Search className="w-8 h-8 text-terminal-yellow" />
              </div>
              <p className="text-terminal-yellow font-mono text-lg mb-2">NO_MATCHES_FOUND</p>
              <p className="text-terminal-gray font-mono text-sm">Try adjusting filters or search parameters</p>
            </div>
          </motion.div>
        )}

        {/* Search Results Header */}
        {filteredOrganizations && filteredOrganizations.length > 0 && (
          <motion.div 
            className="bg-black/50 backdrop-blur-sm p-4 rounded-lg border border-cyber-border mb-6 font-mono text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-neon-green font-bold">λ</span>
                  <span className="text-terminal-gray">search results:</span>
                  <span className="text-neon-green font-bold">{filteredOrganizations.length}</span>
                  <span className="text-terminal-gray">/ {organizations.length}</span>
                </div>
                {analytics && analytics.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-neon-blue font-bold">λ</span>
                    <span className="text-terminal-gray">queries:</span>
                    <span className="text-neon-blue font-bold">{analytics.length}</span>
                  </div>
                )}
              </div>
              {searchTerm && (
                <div className="text-terminal-muted text-xs">
                  query: "<span className="text-neon-yellow">{searchTerm}</span>"
                </div>
              )}
            </div>
          </motion.div>
        )}

        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
        >
          {filteredOrganizations && filteredOrganizations.map((org: Organization, index: number) => {
            const categoryColor = getCategoryColor(org.category);
            return (
              <motion.div 
                key={org.id}
                className={`group bg-black/70 backdrop-blur-md p-4 sm:p-6 rounded-xl border ${categoryColor.border} ${categoryColor.glow} transition-all duration-500 cursor-pointer relative overflow-hidden shadow-lg ${
                  selectedOrganization?.id === org.id ? 'ring-1 ring-neon-green shadow-neon-green/30' : ''
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + index * 0.05, duration: 0.4 }}
                whileHover={{ y: -2, scale: 1.01 }}
                onClick={() => {
                  setSelectedOrganization(org);
                  setModalOrganization(org);
                  setIsModalOpen(true);
                }}
              >
                {/* Subtle data stream effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`text-xs font-mono ${categoryColor.text} opacity-5 whitespace-nowrap overflow-hidden`}>
                      {Array(20).fill('10110100').join(' ')}
                    </div>
                  </div>
                </div>
                
                {/* Status indicator */}
                <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${categoryColor.bg} animate-pulse`}></div>
              
                <div className="relative z-10">
                  {/* Header with terminal prompt */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`${categoryColor.text} font-mono text-xs`}>λ</span>
                        <span className="text-terminal-muted font-mono text-xs uppercase tracking-wider">ENTITY.{org.id.substring(0, 8)}</span>
                      </div>
                      <motion.h3 
                        className="text-base sm:text-lg font-bold text-terminal-white font-mono leading-tight group-hover:text-neon-green transition-colors duration-300 pr-4"
                        layoutId={`title-${org.id}`}
                      >
                        <GlitchText 
                          text={org.name} 
                          glitchProbability={0.001}
                          glitchDuration={80}
                        />
                      </motion.h3>
                    </div>
                  </div>
                
                  {org.category && (
                    <motion.div 
                      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono ${categoryColor.bg} ${categoryColor.text} border ${categoryColor.border} rounded-lg mb-4`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${categoryColor.bg} animate-pulse`}></div>
                      <span className="uppercase tracking-wider">{org.category}</span>
                    </motion.div>
                  )}
                
                  {org.shortBlurb && (
                    <p className="text-terminal-gray font-mono text-xs mb-4 leading-relaxed line-clamp-3 opacity-80">
                      {org.shortBlurb}
                    </p>
                  )}
                
                  <div className="space-y-2 text-xs font-mono mb-4">
                    {org.city && (
                      <div className="flex items-center gap-2 text-terminal-gray">
                        <MapPin className="w-3 h-3 text-terminal-muted" />
                        <span className="opacity-70">{org.city}{org.bcRegion && `, ${org.bcRegion}`}</span>
                      </div>
                    )}
                    
                    {org.yearFounded && (
                      <div className="flex items-center gap-2 text-terminal-gray">
                        <Zap className="w-3 h-3 text-terminal-muted" />
                        <span className="opacity-70">EST. {org.yearFounded}</span>
                      </div>
                    )}
                    
                    {org.size && (
                      <div className="flex items-center gap-2 text-terminal-gray">
                        <Users className="w-3 h-3 text-terminal-muted" />
                        <span className="opacity-70">{org.size}</span>
                      </div>
                    )}
                  </div>
                
                  {/* Quick contact buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {org.website && (
                      <motion.a
                        href={org.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-black/50 border border-neon-green/20 text-neon-green rounded hover:bg-neon-green/10 hover:border-neon-green/40 transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe className="w-3 h-3" />
                        <span>WEB</span>
                      </motion.a>
                    )}
                    {org.linkedin && (
                      <motion.a
                        href={org.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-black/50 border border-neon-blue/20 text-neon-blue rounded hover:bg-neon-blue/10 hover:border-neon-blue/40 transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Users className="w-3 h-3" />
                        <span>LINK</span>
                      </motion.a>
                    )}
                    {org.email && (
                      <motion.a
                        href={`mailto:${org.email}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-black/50 border border-neon-pink/20 text-neon-pink rounded hover:bg-neon-pink/10 hover:border-neon-pink/40 transition-all duration-300"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="w-3 h-3" />
                        <span>MAIL</span>
                      </motion.a>
                    )}
                  </div>
                
                  {/* AI Focus Areas */}
                  {org.aiFocusAreas && org.aiFocusAreas.length > 0 && (
                    <div className="pt-3 border-t border-cyber-border/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Terminal className="w-3 h-3 text-terminal-muted" />
                        <span className="text-terminal-muted font-mono text-xs uppercase">AI.FOCUS_AREAS</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {org.aiFocusAreas.slice(0, 3).map((area, areaIndex) => (
                          <motion.span
                            key={areaIndex}
                            className="text-xs px-2 py-1 bg-black/30 border border-cyber-border/20 text-terminal-gray rounded font-mono"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.5 + index * 0.05 + areaIndex * 0.02 }}
                          >
                            {area}
                          </motion.span>
                        ))}
                        {org.aiFocusAreas.length > 3 && (
                          <span className="text-xs px-2 py-1 text-terminal-muted font-mono">
                            +{org.aiFocusAreas.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Click indicator */}
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="flex items-center gap-1 text-xs text-neon-green font-mono">
                      <div className="w-1 h-1 bg-neon-green rounded-full animate-pulse"></div>
                      <span>VIEW</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Organization Modal */}
        <OrganizationModal
          organization={modalOrganization}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalOrganization(null);
          }}
        />

        {/* Search Analytics */}
        <SearchAnalytics
          analytics={analytics}
          isVisible={showAnalytics}
          onToggle={() => setShowAnalytics(!showAnalytics)}
        />

        <MonitoringDashboard 
          isOpen={showMonitoring}
          onClose={() => setShowMonitoring(false)}
        />
      </div>
    </main>
  );
}