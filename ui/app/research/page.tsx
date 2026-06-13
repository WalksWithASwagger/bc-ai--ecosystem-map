'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Square, 
  Settings, 
  TrendingUp, 
  Search, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Activity,
  Target,
  Shield,
  Zap,
  Eye,
  Filter,
  BarChart3
} from 'lucide-react';

interface PipelineStatus {
  id: string;
  name: string;
  status: 'running' | 'idle' | 'error';
  lastRun: string;
  nextRun: string;
  description: string;
  discoveries: number;
  icon: React.ReactNode;
}

interface Discovery {
  id: string;
  name: string;
  type: 'company' | 'funding' | 'competitive' | 'market';
  tier: number;
  score: number;
  sector: string;
  location: string;
  description: string;
  source: string;
  timestamp: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected';
}

export default function ResearchDashboard() {
  const [pipelines, setPipelines] = useState<PipelineStatus[]>([
    {
      id: 'funding',
      name: 'Funding Intelligence',
      status: 'running',
      lastRun: '2 hours ago',
      nextRun: '4:00 PM',
      description: 'Tracking funding rounds and investment patterns',
      discoveries: 3,
      icon: <TrendingUp className="w-5 h-5" />
    },
    {
      id: 'discovery',
      name: 'Company Discovery',
      status: 'idle',
      lastRun: '6 hours ago', 
      nextRun: 'Tomorrow 9 AM',
      description: 'Finding new companies and emerging opportunities',
      discoveries: 12,
      icon: <Search className="w-5 h-5" />
    },
    {
      id: 'competitive',
      name: 'Competitive Intelligence',
      status: 'running',
      lastRun: '30 min ago',
      nextRun: 'Hourly',
      description: 'Monitoring competitor moves and market threats',
      discoveries: 2,
      icon: <Shield className="w-5 h-5" />
    },
    {
      id: 'scoring',
      name: 'Quality Scoring',
      status: 'running',
      lastRun: 'Continuous',
      nextRun: 'Real-time',
      description: 'AI-powered prioritization and quality assessment',
      discoveries: 847,
      icon: <Target className="w-5 h-5" />
    }
  ]);

  const [discoveries, setDiscoveries] = useState<Discovery[]>([
    {
      id: '1',
      name: 'QuantumLeap AI',
      type: 'company',
      tier: 1,
      score: 92,
      sector: 'Quantum Computing',
      location: 'Vancouver',
      description: 'Breakthrough quantum error correction for commercial applications',
      source: 'University TTO',
      timestamp: '2 hours ago',
      confidence: 95,
      status: 'pending'
    },
    {
      id: '2',
      name: 'MedTech Solutions raises $15M',
      type: 'funding',
      tier: 1,
      score: 88,
      sector: 'HealthTech',
      location: 'Victoria',
      description: 'Series A led by strategic healthcare investor',
      source: 'BetaKit',
      timestamp: '4 hours ago',
      confidence: 90,
      status: 'pending'
    },
    {
      id: '3',
      name: 'Competitor acquires AI talent',
      type: 'competitive',
      tier: 2,
      score: 76,
      sector: 'AI/ML',
      location: 'Seattle',
      description: 'Key hire from Google DeepMind team',
      source: 'LinkedIn',
      timestamp: '6 hours ago',
      confidence: 85,
      status: 'approved'
    }
  ]);

  const [stats, setStats] = useState({
    totalDiscoveries: 847,
    pendingApproval: 23,
    tier1Count: 3,
    threatAlerts: 2,
    qualityScore: 94,
    pipelinesActive: 3
  });

  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);

  const startPipeline = async (pipelineId: string) => {
    setIsRunningPipeline(true);
    // Simulate API call
    setTimeout(() => {
      setPipelines(prev => prev.map(p => 
        p.id === pipelineId ? { ...p, status: 'running' as const } : p
      ));
      setIsRunningPipeline(false);
    }, 2000);
  };

  const stopPipeline = async (pipelineId: string) => {
    setPipelines(prev => prev.map(p => 
      p.id === pipelineId ? { ...p, status: 'idle' as const } : p
    ));
  };

  const approveDiscovery = (discoveryId: string) => {
    setDiscoveries(prev => prev.map(d =>
      d.id === discoveryId ? { ...d, status: 'approved' as const } : d
    ));
    setStats(prev => ({ ...prev, pendingApproval: prev.pendingApproval - 1 }));
  };

  const rejectDiscovery = (discoveryId: string) => {
    setDiscoveries(prev => prev.map(d =>
      d.id === discoveryId ? { ...d, status: 'rejected' as const } : d
    ));
    setStats(prev => ({ ...prev, pendingApproval: prev.pendingApproval - 1 }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400';
      case 'idle': return 'text-gray-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Activity className="w-3 h-3 animate-pulse" />;
      case 'idle': return <Clock className="w-3 h-3" />;
      case 'error': return <AlertTriangle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return 'text-red-400 bg-red-400/10';
      case 2: return 'text-orange-400 bg-orange-400/10';
      case 3: return 'text-yellow-400 bg-yellow-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getTierLabel = (tier: number) => {
    switch (tier) {
      case 1: return 'Critical';
      case 2: return 'High';
      case 3: return 'Medium';
      default: return 'Low';
    }
  };

  const filteredDiscoveries = discoveries.filter(d => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pending') return d.status === 'pending';
    if (selectedFilter === 'tier1') return d.tier === 1;
    return d.type === selectedFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-purple-500/20 bg-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Research Intelligence Command Center
              </h1>
              <p className="text-gray-400 mt-2">
                Autonomous competitive intelligence and market research platform
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-green-400">
                <Activity className="w-4 h-4 animate-pulse" />
                <span className="text-sm">System Active</span>
              </div>
              <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          {[
            { label: 'Total Discoveries', value: stats.totalDiscoveries, icon: Database, color: 'text-blue-400' },
            { label: 'Pending Approval', value: stats.pendingApproval, icon: Clock, color: 'text-yellow-400' },
            { label: 'Tier 1 Critical', value: stats.tier1Count, icon: AlertTriangle, color: 'text-red-400' },
            { label: 'Threat Alerts', value: stats.threatAlerts, icon: Shield, color: 'text-orange-400' },
            { label: 'Quality Score', value: `${stats.qualityScore}%`, icon: Target, color: 'text-green-400' },
            { label: 'Active Pipelines', value: stats.pipelinesActive, icon: Zap, color: 'text-purple-400' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
                          initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pipeline Control */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Pipeline Control Center
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pipelines.map((pipeline) => (
              <div key={pipeline.id} className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600/20 rounded-lg">
                      {pipeline.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{pipeline.name}</h3>
                      <p className="text-sm text-gray-400">{pipeline.description}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 ${getStatusColor(pipeline.status)}`}>
                    {getStatusIcon(pipeline.status)}
                    <span className="text-sm capitalize">{pipeline.status}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-400">Last run:</span>
                    <span className="ml-2">{pipeline.lastRun}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Next run:</span>
                    <span className="ml-2">{pipeline.nextRun}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Discoveries:</span>
                    <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-sm">
                      {pipeline.discoveries}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {pipeline.status === 'running' ? (
                      <button
                        onClick={() => stopPipeline(pipeline.id)}
                        className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 text-sm"
                      >
                        <Square className="w-3 h-3" />
                        Stop
                      </button>
                    ) : (
                      <button
                        onClick={() => startPipeline(pipeline.id)}
                        disabled={isRunningPipeline}
                        className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 text-sm disabled:opacity-50"
                      >
                        <Play className="w-3 h-3" />
                        Start
                      </button>
                    )}
                    <button className="bg-gray-600/20 hover:bg-gray-600/30 text-gray-400 px-3 py-1 rounded-lg transition-colors">
                      <Settings className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Discoveries Browser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-400" />
              Latest Discoveries
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="bg-black/40 border border-purple-500/20 rounded-lg px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="pending">Pending Review</option>
                <option value="tier1">Tier 1 Critical</option>
                <option value="company">Companies</option>
                <option value="funding">Funding</option>
                <option value="competitive">Competitive</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {filteredDiscoveries.map((discovery) => (
                <motion.div
                  key={discovery.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-black/40 backdrop-blur-sm border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{discovery.name}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTierColor(discovery.tier)}`}>
                          Tier {discovery.tier} - {getTierLabel(discovery.tier)}
                        </span>
                        <span className="text-sm text-gray-400">Score: {discovery.score}/100</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                        <span>{discovery.sector}</span>
                        <span>•</span>
                        <span>{discovery.location}</span>
                        <span>•</span>
                        <span>{discovery.source}</span>
                        <span>•</span>
                        <span>{discovery.timestamp}</span>
                      </div>
                      <p className="text-gray-300">{discovery.description}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-sm text-gray-400">Confidence: {discovery.confidence}%</span>
                    </div>
                  </div>

                  {discovery.status === 'pending' && (
                    <div className="flex items-center gap-2 pt-4 border-t border-purple-500/20">
                      <button
                        onClick={() => approveDiscovery(discovery.id)}
                        className="bg-green-600/20 hover:bg-green-600/30 text-green-400 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve for DB
                      </button>
                      <button
                        onClick={() => rejectDiscovery(discovery.id)}
                        className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-2 rounded-lg transition-colors"
                      >
                        Reject
                      </button>
                      <button className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 px-4 py-2 rounded-lg transition-colors">
                        Research More
                      </button>
                      <button className="bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 px-4 py-2 rounded-lg transition-colors">
                        Set Alert
                      </button>
                    </div>
                  )}

                  {discovery.status === 'approved' && (
                    <div className="flex items-center gap-2 pt-4 border-t border-green-500/20">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-sm">Approved for database</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredDiscoveries.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No discoveries found for the selected filter.</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}