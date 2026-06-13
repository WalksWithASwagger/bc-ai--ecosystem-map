'use client';

import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { performanceMonitor } from '../lib/monitoring';
import { useTheme } from '../contexts/ThemeContext';

export default function MonitoringStatus() {
  const { theme } = useTheme();
  const [status, setStatus] = useState<'good' | 'warning' | 'error'>('good');
  const [errorCount, setErrorCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const checkStatus = () => {
      try {
        const errorSummary = performanceMonitor.getErrorSummary();
        const perfSummary = performanceMonitor.getPerformanceSummary();
        
        // Determine status based on errors and performance
        let currentStatus: 'good' | 'warning' | 'error' = 'good';
        
        if (errorSummary.lastHour > 0) {
          currentStatus = errorSummary.lastHour > 5 ? 'error' : 'warning';
        }
        
        // Check search performance
        if (perfSummary.search_duration && perfSummary.search_duration.average > 1000) {
          currentStatus = currentStatus === 'error' ? 'error' : 'warning';
        }
        
        setStatus(currentStatus);
        setErrorCount(errorSummary.lastHour);
        setLastUpdate(new Date());
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
        console.warn('Error checking monitoring status:', error);
      }
      }
    };

    // Initial check
    checkStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'good':
        return 'text-green-400';
      case 'warning':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'good':
        return 'System Healthy';
      case 'warning':
        return `${errorCount} Warning${errorCount !== 1 ? 's' : ''}`;
      case 'error':
        return `${errorCount} Error${errorCount !== 1 ? 's' : ''}`;
    }
  };

  return (
    <div className={`
      flex items-center gap-2 px-3 py-1 backdrop-blur-sm rounded-lg transition-all duration-300
      ${theme === 'dark' 
        ? 'bg-black/30 border border-cyan-500/30' 
        : 'bg-white/50 border border-gray-300/50'
      }
    `}>
      <Activity className={`w-3 h-3 animate-pulse ${theme === 'dark' ? 'text-cyan-400' : 'text-blue-600'}`} />
      {getStatusIcon()}
      <span className={`font-mono text-xs ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      <div className={`w-1 h-1 rounded-full animate-pulse ${theme === 'dark' ? 'bg-cyan-400' : 'bg-blue-600'}`} />
    </div>
  );
}