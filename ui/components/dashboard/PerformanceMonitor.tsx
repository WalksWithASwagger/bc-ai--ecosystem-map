'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, 
  Zap, 
  Clock, 
  Database, 
  Wifi, 
  Eye,
  AlertTriangle,
  CheckCircle,
  Info,
  Gauge,
  Monitor,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  Globe,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface PerformanceMetrics {
  fps: number
  loadTime: number
  memoryUsage: number
  bundleSize: number
  apiLatency: number
  cacheHitRate: number
  errorRate: number
  uptime: number
  networkSpeed: number
  renderTime: number
}

interface PerformanceAlert {
  id: string
  type: 'warning' | 'error' | 'info' | 'success'
  title: string
  message: string
  timestamp: Date
  metric?: string
}

const PerformanceMonitor: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    loadTime: 1.2,
    memoryUsage: 45.6,
    bundleSize: 2.1,
    apiLatency: 150,
    cacheHitRate: 94.5,
    errorRate: 0.1,
    uptime: 99.8,
    networkSpeed: 125.3,
    renderTime: 16.7
  })
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([])
  const [history, setHistory] = useState<{ timestamp: Date, metrics: PerformanceMetrics }[]>([])
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const animationRef = useRef<number>()

  // FPS Monitoring
  useEffect(() => {
    const measureFPS = () => {
      frameCountRef.current++
      const now = performance.now()
      const delta = now - lastTimeRef.current

      if (delta >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / delta)
        setMetrics(prev => ({ ...prev, fps }))
        
        frameCountRef.current = 0
        lastTimeRef.current = now

        // Check for performance issues
        if (fps < 30) {
          addAlert('warning', 'Low FPS Detected', `Frame rate dropped to ${fps} FPS`, 'fps')
        }
      }

      if (isMonitoring) {
        animationRef.current = requestAnimationFrame(measureFPS)
      }
    }

    if (isMonitoring) {
      animationRef.current = requestAnimationFrame(measureFPS)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isMonitoring])

  // Memory and Performance Monitoring
  useEffect(() => {
    if (!isMonitoring) return

    const monitoringInterval = setInterval(() => {
      // Simulate real performance metrics
      const newMetrics: PerformanceMetrics = {
        fps: Math.max(30, Math.min(60, metrics.fps + (Math.random() - 0.5) * 5)),
        loadTime: Math.max(0.5, metrics.loadTime + (Math.random() - 0.5) * 0.3),
        memoryUsage: Math.max(20, Math.min(80, metrics.memoryUsage + (Math.random() - 0.5) * 5)),
        bundleSize: Math.max(1.5, metrics.bundleSize + (Math.random() - 0.5) * 0.1),
        apiLatency: Math.max(50, metrics.apiLatency + (Math.random() - 0.5) * 30),
        cacheHitRate: Math.max(80, Math.min(100, metrics.cacheHitRate + (Math.random() - 0.5) * 2)),
        errorRate: Math.max(0, Math.min(5, metrics.errorRate + (Math.random() - 0.5) * 0.5)),
        uptime: Math.max(95, Math.min(100, metrics.uptime + (Math.random() - 0.5) * 0.5)),
        networkSpeed: Math.max(50, metrics.networkSpeed + (Math.random() - 0.5) * 20),
        renderTime: Math.max(8, Math.min(32, metrics.renderTime + (Math.random() - 0.5) * 3))
      }

      setMetrics(newMetrics)
      
      // Add to history
      setHistory(prev => {
        const newHistory = [...prev, { timestamp: new Date(), metrics: newMetrics }]
        return newHistory.slice(-50) // Keep last 50 measurements
      })

      // Performance alerts
      if (newMetrics.memoryUsage > 70) {
        addAlert('warning', 'High Memory Usage', `Memory usage at ${newMetrics.memoryUsage.toFixed(1)}%`, 'memory')
      }
      
      if (newMetrics.apiLatency > 300) {
        addAlert('error', 'High API Latency', `API response time: ${newMetrics.apiLatency}ms`, 'api')
      }

      if (newMetrics.errorRate > 2) {
        addAlert('error', 'High Error Rate', `Error rate: ${newMetrics.errorRate.toFixed(1)}%`, 'errors')
      }
    }, 2000)

    return () => clearInterval(monitoringInterval)
  }, [isMonitoring, metrics])

  const addAlert = (type: PerformanceAlert['type'], title: string, message: string, metric?: string) => {
    const newAlert: PerformanceAlert = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date(),
      metric
    }

    setAlerts(prev => {
      // Avoid duplicate alerts for the same metric
      const filtered = prev.filter(alert => alert.metric !== metric || Date.now() - alert.timestamp.getTime() > 10000)
      return [newAlert, ...filtered].slice(0, 10)
    })

    // Auto-remove alerts after 10 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== newAlert.id))
    }, 10000)
  }

  const getMetricStatus = (value: number, thresholds: { good: number, warning: number }) => {
    if (value <= thresholds.good) return 'good'
    if (value <= thresholds.warning) return 'warning'
    return 'critical'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'critical': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 dark:bg-green-900/20'
      case 'warning': return 'bg-yellow-100 dark:bg-yellow-900/20'
      case 'critical': return 'bg-red-100 dark:bg-red-900/20'
      default: return 'bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const performanceMetricCards = [
    {
      key: 'fps',
      label: 'Frame Rate',
      value: `${metrics.fps} FPS`,
      icon: Gauge,
      status: getMetricStatus(60 - metrics.fps, { good: 5, warning: 15 }),
      description: 'Animation smoothness'
    },
    {
      key: 'loadTime',
      label: 'Load Time',
      value: `${metrics.loadTime.toFixed(1)}s`,
      icon: Clock,
      status: getMetricStatus(metrics.loadTime, { good: 2, warning: 4 }),
      description: 'Initial page load'
    },
    {
      key: 'memoryUsage',
      label: 'Memory Usage',
      value: `${metrics.memoryUsage.toFixed(1)}%`,
      icon: MemoryStick,
      status: getMetricStatus(metrics.memoryUsage, { good: 50, warning: 70 }),
      description: 'RAM consumption'
    },
    {
      key: 'bundleSize',
      label: 'Bundle Size',
      value: `${metrics.bundleSize.toFixed(1)}MB`,
      icon: HardDrive,
      status: getMetricStatus(metrics.bundleSize, { good: 2, warning: 3 }),
      description: 'JavaScript bundle'
    },
    {
      key: 'apiLatency',
      label: 'API Latency',
      value: `${metrics.apiLatency}ms`,
      icon: Server,
      status: getMetricStatus(metrics.apiLatency, { good: 200, warning: 300 }),
      description: 'Server response time'
    },
    {
      key: 'cacheHitRate',
      label: 'Cache Hit Rate',
      value: `${metrics.cacheHitRate.toFixed(1)}%`,
      icon: Database,
      status: getMetricStatus(100 - metrics.cacheHitRate, { good: 5, warning: 15 }),
      description: 'Cache efficiency'
    },
    {
      key: 'errorRate',
      label: 'Error Rate',
      value: `${metrics.errorRate.toFixed(1)}%`,
      icon: AlertTriangle,
      status: getMetricStatus(metrics.errorRate, { good: 1, warning: 2 }),
      description: 'Application errors'
    },
    {
      key: 'uptime',
      label: 'Uptime',
      value: `${metrics.uptime.toFixed(1)}%`,
      icon: CheckCircle,
      status: getMetricStatus(100 - metrics.uptime, { good: 1, warning: 5 }),
      description: 'Service availability'
    }
  ]

  const getAlertIcon = (type: PerformanceAlert['type']) => {
    switch (type) {
      case 'error': return <AlertTriangle className="text-red-500" size={16} />
      case 'warning': return <AlertTriangle className="text-yellow-500" size={16} />
      case 'success': return <CheckCircle className="text-green-500" size={16} />
      default: return <Info className="text-blue-500" size={16} />
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ⚡ Performance Monitor
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time dashboard performance analytics and optimization insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              isMonitoring
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isMonitoring ? (
              <>
                <Activity className="animate-pulse" size={16} />
                Stop Monitoring
              </>
            ) : (
              <>
                <Monitor size={16} />
                Start Monitoring
              </>
            )}
          </motion.button>
          
          {isMonitoring && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-lg"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Live</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Performance Alerts */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Performance Alerts
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    alert.type === 'error'
                      ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                      : alert.type === 'warning'
                      ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                      : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                  }`}
                >
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {alert.title}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">
                      {alert.message}
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                      {alert.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {performanceMetricCards.map((metric, index) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={metric.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-xl border transition-all ${getStatusBg(metric.status)} ${
                metric.status === 'critical' ? 'border-red-300 dark:border-red-600' :
                metric.status === 'warning' ? 'border-yellow-300 dark:border-yellow-600' :
                'border-green-300 dark:border-green-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={getStatusColor(metric.status)} size={20} />
                <div className={`w-2 h-2 rounded-full ${
                  metric.status === 'critical' ? 'bg-red-500' :
                  metric.status === 'warning' ? 'bg-yellow-500' :
                  'bg-green-500'
                }`} />
              </div>
              
              <div className="mb-1">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {metric.label}
                </p>
              </div>
              
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {metric.description}
              </p>
              
              {/* Mini trend indicator */}
              {history.length > 1 && (
                <div className="mt-2">
                  {(() => {
                    const current = history[history.length - 1]?.metrics[metric.key as keyof PerformanceMetrics] || 0
                    const previous = history[history.length - 2]?.metrics[metric.key as keyof PerformanceMetrics] || 0
                    const trend = current - previous
                    
                    return (
                      <div className={`flex items-center gap-1 text-xs ${
                        trend > 0 ? 'text-red-500' : trend < 0 ? 'text-green-500' : 'text-gray-500'
                      }`}>
                        {trend > 0 ? <TrendingUp size={12} /> : 
                         trend < 0 ? <TrendingDown size={12} /> : 
                         <div className="w-3 h-3" />}
                        <span>{Math.abs(trend).toFixed(1)}</span>
                      </div>
                    )
                  })()}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Performance History Chart */}
      {isMonitoring && history.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance Timeline
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* FPS Chart */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frame Rate (FPS)
              </h4>
              <div className="h-24 flex items-end gap-1">
                {history.slice(-20).map((point, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-blue-500 rounded-t"
                    style={{ height: `${(point.metrics.fps / 60) * 100}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Memory Usage Chart */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Memory Usage (%)
              </h4>
              <div className="h-24 flex items-end gap-1">
                {history.slice(-20).map((point, index) => (
                  <div
                    key={index}
                    className={`flex-1 rounded-t ${
                      point.metrics.memoryUsage > 70 ? 'bg-red-500' :
                      point.metrics.memoryUsage > 50 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ height: `${point.metrics.memoryUsage}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Performance Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
      >
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 Performance Optimization Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <h4 className="font-medium mb-1">Frontend Optimization:</h4>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Use React.memo for expensive components</li>
              <li>Implement virtual scrolling for large lists</li>
              <li>Optimize images with WebP format</li>
              <li>Enable lazy loading for off-screen content</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">Bundle Optimization:</h4>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Code-split routes and components</li>
              <li>Tree-shake unused dependencies</li>
              <li>Use dynamic imports for heavy libraries</li>
              <li>Enable compression (Gzip/Brotli)</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default PerformanceMonitor