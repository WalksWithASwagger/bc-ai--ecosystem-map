import { useState, useEffect, useCallback } from 'react';

interface PipelineStatus {
  id: string;
  name: string;
  status: 'running' | 'idle' | 'error';
  lastRun: string;
  nextRun: string;
  description: string;
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

interface ResearchStats {
  totalDiscoveries: number;
  pendingApproval: number;
  tier1Count: number;
  threatAlerts: number;
  qualityScore: number;
  pipelinesActive: number;
}

export function useResearchData() {
  const [pipelines, setPipelines] = useState<PipelineStatus[]>([]);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [stats, setStats] = useState<ResearchStats>({
    totalDiscoveries: 0,
    pendingApproval: 0,
    tier1Count: 0,
    threatAlerts: 0,
    qualityScore: 0,
    pipelinesActive: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch pipeline status
  const fetchPipelines = useCallback(async () => {
    try {
      const response = await fetch('/api/research/pipelines');
      const data = await response.json();
      
      if (data.success) {
        setPipelines(data.pipelines);
        
        // Update active pipelines count
        const activeCount = data.pipelines.filter((p: PipelineStatus) => p.status === 'running').length;
        setStats(prev => ({ ...prev, pipelinesActive: activeCount }));
      } else {
        throw new Error(data.error || 'Failed to fetch pipelines');
      }
    } catch (err) {
      console.error('Error fetching pipelines:', err);
      setError('Failed to load pipeline status');
    }
  }, []);

  // Fetch discoveries
  const fetchDiscoveries = useCallback(async (filter = 'all', limit = 50, offset = 0) => {
    try {
      const response = await fetch(`/api/research/discoveries?filter=${filter}&limit=${limit}&offset=${offset}`);
      const data = await response.json();
      
      if (data.success) {
        setDiscoveries(data.discoveries);
        
        // Update stats from discovery data
        if (data.stats) {
          setStats(prev => ({
            ...prev,
            totalDiscoveries: data.stats.total,
            pendingApproval: data.stats.pending,
            tier1Count: data.stats.tier1,
            qualityScore: Math.round(data.stats.averageScore)
          }));
        }
      } else {
        throw new Error(data.error || 'Failed to fetch discoveries');
      }
    } catch (err) {
      console.error('Error fetching discoveries:', err);
      setError('Failed to load discoveries');
    }
  }, []);

  // Control pipeline actions
  const controlPipeline = useCallback(async (action: string, pipelineId: string) => {
    try {
      const response = await fetch('/api/research/pipelines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, pipelineId }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh pipeline status
        await fetchPipelines();
        return true;
      } else {
        throw new Error(data.error || 'Pipeline action failed');
      }
    } catch (err) {
      console.error('Error controlling pipeline:', err);
      setError(`Failed to ${action} pipeline`);
      return false;
    }
  }, [fetchPipelines]);

  // Approve/reject discoveries
  const handleDiscoveryAction = useCallback(async (action: string, discoveryId: string, additionalData?: any) => {
    try {
      const response = await fetch('/api/research/discoveries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action, 
          discoveryId, 
          discoveryData: additionalData 
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setDiscoveries(prev => prev.map(d => 
          d.id === discoveryId 
            ? { ...d, status: action === 'approve' ? 'approved' : 'rejected' }
            : d
        ));
        
        // Update pending count
        if (action === 'approve' || action === 'reject') {
          setStats(prev => ({ 
            ...prev, 
            pendingApproval: Math.max(0, prev.pendingApproval - 1) 
          }));
        }
        
        return true;
      } else {
        throw new Error(data.error || 'Discovery action failed');
      }
    } catch (err) {
      console.error('Error handling discovery action:', err);
      setError(`Failed to ${action} discovery`);
      return false;
    }
  }, []);

  // Real-time updates via polling
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchPipelines(),
          fetchDiscoveries()
        ]);
      } catch (err) {
        console.error('Error loading initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Set up polling for real-time updates
    const pollInterval = setInterval(() => {
      fetchPipelines();
      fetchDiscoveries();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }, [fetchPipelines, fetchDiscoveries]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPipelines(),
        fetchDiscoveries()
      ]);
    } finally {
      setLoading(false);
    }
  }, [fetchPipelines, fetchDiscoveries]);

  return {
    // Data
    pipelines,
    discoveries,
    stats,
    
    // State
    loading,
    error,
    
    // Actions
    controlPipeline,
    handleDiscoveryAction,
    fetchDiscoveries,
    refresh,
    
    // Utility
    clearError: () => setError(null)
  };
}

// Hook for real-time pipeline monitoring
export function usePipelineMonitoring() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    
    // In a real implementation, this would connect to a WebSocket
    // or Server-Sent Events for real-time log streaming
    const logInterval = setInterval(() => {
      const timestamp = new Date().toISOString();
      const events = [
        'Pipeline discovery started',
        'Found 3 new companies',
        'Quality scoring completed',
        'Competitive intelligence updated',
        'Funding data processed'
      ];
      
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      setLogs(prev => [`[${timestamp}] ${randomEvent}`, ...prev.slice(0, 49)]);
    }, 5000);

    return () => {
      clearInterval(logInterval);
      setIsMonitoring(false);
    };
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    isMonitoring,
    logs,
    startMonitoring,
    stopMonitoring,
    clearLogs
  };
}