'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Square, 
  Activity,
  TrendingUp,
  AlertTriangle,
  Database,
  Clock,
  Target,
  Filter,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface PipelineStatus {
  id: string;
  name: string;
  status: 'running' | 'idle' | 'error';
  lastRun: string;
  discoveries: number;
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

export default function StreamlinedResearchDashboard() {
  const [pipelines, setPipelines] = useState<PipelineStatus[]>([]);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch pipelines
      const pipelineRes = await fetch('/api/research/pipelines');
      const pipelineData = await pipelineRes.json();
      if (pipelineData.success) {
        setPipelines(pipelineData.pipelines);
      }

      // Fetch discoveries
      const discoveryRes = await fetch('/api/research/discoveries');
      const discoveryData = await discoveryRes.json();
      if (discoveryData.success) {
        setDiscoveries(discoveryData.discoveries);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startPipeline = async (pipelineId: string) => {
    try {
      await fetch('/api/research/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', pipelineId }),
      });
      fetchData(); // Refresh
    } catch (error) {
      console.error('Failed to start pipeline:', error);
    }
  };

  const approveDiscovery = async (discoveryId: string) => {
    try {
      await fetch('/api/research/discoveries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', discoveryId }),
      });
      fetchData(); // Refresh
    } catch (error) {
      console.error('Failed to approve discovery:', error);
    }
  };

  const filteredDiscoveries = discoveries.filter(d => {
    if (filter === 'all') return true;
    if (filter === 'pending') return d.status === 'pending';
    if (filter === 'tier1') return d.tier === 1;
    return d.type === filter;
  });

  const stats = {
    total: discoveries.length,
    pending: discoveries.filter(d => d.status === 'pending').length,
    tier1: discoveries.filter(d => d.tier === 1).length,
    active: pipelines.filter(p => p.status === 'running').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Minimal */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-gray-700" />
              <h1 className="text-lg font-semibold text-gray-900">Research Intelligence</h1>
            </div>
            
            {/* Key Stats - Compact */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{stats.total} discoveries</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-gray-600">{stats.pending} pending</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-gray-600">{stats.tier1} critical</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-gray-600">{stats.active} active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Pipeline Control - Horizontal Layout */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-sm font-medium text-gray-900">Pipeline Status</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {pipelines.map((pipeline) => (
                <div key={pipeline.id} className="border border-gray-200 rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium text-gray-900">{pipeline.name}</div>
                    <div className={`w-2 h-2 rounded-full ${
                      pipeline.status === 'running' ? 'bg-green-500' : 
                      pipeline.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    Last: {pipeline.lastRun} • Found: {pipeline.discoveries}
                  </div>
                  <button
                    onClick={() => startPipeline(pipeline.id)}
                    className={`w-full text-xs px-3 py-2 rounded ${
                      pipeline.status === 'running' 
                        ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                    disabled={pipeline.status === 'running'}
                  >
                    {pipeline.status === 'running' ? (
                      <>
                        <Square className="w-3 h-3 inline mr-1" />
                        Running
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 inline mr-1" />
                        Start
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Discoveries - Table Layout */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-900">Discoveries</h2>
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All ({discoveries.length})</option>
                <option value="pending">Pending ({stats.pending})</option>
                <option value="tier1">Critical ({stats.tier1})</option>
                <option value="funding">Funding</option>
                <option value="company">Companies</option>
                <option value="competitive">Competitive</option>
              </select>
            </div>
          </div>

          {filteredDiscoveries.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Database className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>No discoveries found.</p>
              <p className="text-xs mt-1">Run a pipeline to collect data.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr className="text-xs text-gray-600">
                    <th className="text-left px-6 py-3 font-medium">Name</th>
                    <th className="text-left px-6 py-3 font-medium">Type</th>
                    <th className="text-left px-6 py-3 font-medium">Score</th>
                    <th className="text-left px-6 py-3 font-medium">Sector</th>
                    <th className="text-left px-6 py-3 font-medium">Location</th>
                    <th className="text-left px-6 py-3 font-medium">Source</th>
                    <th className="text-left px-6 py-3 font-medium">Status</th>
                    <th className="text-left px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDiscoveries.map((discovery) => (
                    <tr key={discovery.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{discovery.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {discovery.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          discovery.type === 'funding' ? 'bg-green-100 text-green-800' :
                          discovery.type === 'company' ? 'bg-blue-100 text-blue-800' :
                          discovery.type === 'competitive' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {discovery.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900">{discovery.score}</div>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            discovery.tier === 1 ? 'bg-red-500' :
                            discovery.tier === 2 ? 'bg-amber-500' :
                            'bg-green-500'
                          }`} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{discovery.sector}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{discovery.location}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{discovery.source}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          discovery.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          discovery.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {discovery.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {discovery.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => approveDiscovery(discovery.id)}
                              className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button className="text-xs bg-gray-600 text-white px-2 py-1 rounded hover:bg-gray-700">
                              Reject
                            </button>
                          </div>
                        )}
                        {discovery.status === 'approved' && (
                          <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            Export
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}