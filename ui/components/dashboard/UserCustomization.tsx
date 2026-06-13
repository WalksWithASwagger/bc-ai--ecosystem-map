'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { 
  Settings, 
  Palette, 
  Layout, 
  Eye,
  EyeOff,
  Star,
  Heart,
  Bookmark,
  Bell,
  BellOff,
  Save,
  RotateCcw,
  Download,
  Upload,
  User,
  Shield,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Grid,
  List,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Filter
} from 'lucide-react'

interface DashboardWidget {
  id: string
  name: string
  component: string
  icon: any
  enabled: boolean
  position: number
  size: 'small' | 'medium' | 'large'
  category: 'analytics' | 'data' | 'monitoring' | 'social'
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  layout: 'grid' | 'list' | 'compact'
  animationsEnabled: boolean
  notificationsEnabled: boolean
  autoRefresh: boolean
  refreshInterval: number
  favoriteCompanies: string[]
  bookmarkedReports: string[]
  watchlistAlerts: boolean
  compactMode: boolean
  colorScheme: 'blue' | 'purple' | 'green' | 'orange' | 'red'
  fontSize: 'small' | 'medium' | 'large'
  language: 'en' | 'fr'
}

interface CustomDashboard {
  id: string
  name: string
  widgets: DashboardWidget[]
  isDefault: boolean
  createdAt: Date
  lastModified: Date
}

const UserCustomization: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'appearance' | 'layout' | 'widgets' | 'preferences' | 'export'>('appearance')
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'auto',
    layout: 'grid',
    animationsEnabled: true,
    notificationsEnabled: true,
    autoRefresh: true,
    refreshInterval: 300,
    favoriteCompanies: [],
    bookmarkedReports: [],
    watchlistAlerts: true,
    compactMode: false,
    colorScheme: 'blue',
    fontSize: 'medium',
    language: 'en'
  })

  const [availableWidgets] = useState<DashboardWidget[]>([
    {
      id: 'hero-metrics',
      name: 'Hero Metrics',
      component: 'EnhancedHeroMetrics',
      icon: BarChart3,
      enabled: true,
      position: 1,
      size: 'large',
      category: 'analytics'
    },
    {
      id: 'company-cards',
      name: 'Company Cards',
      component: 'InteractiveCompanyCards',
      icon: Grid,
      enabled: true,
      position: 2,
      size: 'large',
      category: 'data'
    },
    {
      id: 'leaderboards',
      name: 'Leaderboards',
      component: 'AdvancedLeaderboards',
      icon: List,
      enabled: true,
      position: 3,
      size: 'large',
      category: 'analytics'
    },
    {
      id: 'government-metrics',
      name: 'Government Metrics',
      component: 'GovernmentMetrics',
      icon: PieChart,
      enabled: true,
      position: 4,
      size: 'medium',
      category: 'analytics'
    },
    {
      id: 'data-visualization',
      name: 'Data Visualization',
      component: 'DataVisualization',
      icon: Activity,
      enabled: true,
      position: 5,
      size: 'large',
      category: 'analytics'
    },
    {
      id: 'performance-monitor',
      name: 'Performance Monitor',
      component: 'PerformanceMonitor',
      icon: Zap,
      enabled: false,
      position: 6,
      size: 'medium',
      category: 'monitoring'
    },
    {
      id: 'advanced-search',
      name: 'Advanced Search',
      component: 'AdvancedSearch',
      icon: Filter,
      enabled: false,
      position: 7,
      size: 'medium',
      category: 'data'
    }
  ])

  const [widgets, setWidgets] = useState<DashboardWidget[]>(availableWidgets)
  const [customDashboards, setCustomDashboards] = useState<CustomDashboard[]>([
    {
      id: 'default',
      name: 'Default Dashboard',
      widgets: availableWidgets.filter(w => w.enabled),
      isDefault: true,
      createdAt: new Date(),
      lastModified: new Date()
    }
  ])

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-preferences')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setPreferences(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error('Failed to load preferences:', error)
      }
    }
  }, [])

  // Save preferences to localStorage
  const savePreferences = () => {
    localStorage.setItem('dashboard-preferences', JSON.stringify(preferences))
    
    // Apply theme changes
    if (preferences.theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (preferences.theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      // Auto theme based on system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      if (mediaQuery.matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    // Apply font size changes
    document.documentElement.style.fontSize = {
      small: '14px',
      medium: '16px',
      large: '18px'
    }[preferences.fontSize]


  }

  const resetPreferences = () => {
    const defaultPrefs: UserPreferences = {
      theme: 'auto',
      layout: 'grid',
      animationsEnabled: true,
      notificationsEnabled: true,
      autoRefresh: true,
      refreshInterval: 300,
      favoriteCompanies: [],
      bookmarkedReports: [],
      watchlistAlerts: true,
      compactMode: false,
      colorScheme: 'blue',
      fontSize: 'medium',
      language: 'en'
    }
    setPreferences(defaultPrefs)
    localStorage.removeItem('dashboard-preferences')
  }

  const exportSettings = () => {
    const settings = {
      preferences,
      widgets: widgets.filter(w => w.enabled),
      customDashboards,
      exportDate: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-settings-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string)
        if (settings.preferences) setPreferences(settings.preferences)
        if (settings.widgets) setWidgets(settings.widgets)
        if (settings.customDashboards) setCustomDashboards(settings.customDashboards)
  
      } catch (error) {
        console.error('Failed to import settings:', error)
        alert('Failed to import settings. Please check the file format.')
      }
    }
    reader.readAsText(file)
  }

  const toggleWidget = (widgetId: string) => {
    setWidgets(prev => 
      prev.map(widget => 
        widget.id === widgetId 
          ? { ...widget, enabled: !widget.enabled }
          : widget
      )
    )
  }

  const updateWidgetSize = (widgetId: string, size: DashboardWidget['size']) => {
    setWidgets(prev => 
      prev.map(widget => 
        widget.id === widgetId 
          ? { ...widget, size }
          : widget
      )
    )
  }

  const createCustomDashboard = () => {
    const name = prompt('Enter dashboard name:')
    if (!name) return

    const newDashboard: CustomDashboard = {
      id: Date.now().toString(),
      name,
      widgets: widgets.filter(w => w.enabled),
      isDefault: false,
      createdAt: new Date(),
      lastModified: new Date()
    }

    setCustomDashboards(prev => [...prev, newDashboard])
  }

  const getColorSchemeClasses = (scheme: string) => {
    const schemes = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      red: 'from-red-500 to-red-600'
    }
    return schemes[scheme as keyof typeof schemes] || schemes.blue
  }

  const tabs = [
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'layout', name: 'Layout', icon: Layout },
    { id: 'widgets', name: 'Widgets', icon: Grid },
    { id: 'preferences', name: 'Preferences', icon: Settings },
    { id: 'export', name: 'Import/Export', icon: Download }
  ]

  return (
    <>
      {/* Settings Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all"
      >
        <Settings size={24} />
      </motion.button>

      {/* Settings Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  🎨 Dashboard Customization
                </h2>
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={savePreferences}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Save size={16} />
                    Save
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </motion.button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all flex-1 justify-center ${
                        activeTab === tab.id
                          ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      <Icon size={16} />
                      {tab.name}
                    </motion.button>
                  )
                })}
              </div>

              {/* Tab Content */}
              <div className="max-h-96 overflow-y-auto">
                {activeTab === 'appearance' && (
                  <div className="space-y-6">
                    {/* Theme Selection */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Theme</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'light', label: 'Light', icon: Sun },
                          { value: 'dark', label: 'Dark', icon: Moon },
                          { value: 'auto', label: 'Auto', icon: Monitor }
                        ].map((theme) => {
                          const Icon = theme.icon
                          return (
                            <motion.button
                              key={theme.value}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setPreferences(prev => ({ ...prev, theme: theme.value as any }))}
                              className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                                preferences.theme === theme.value
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                              }`}
                            >
                              <Icon size={20} />
                              {theme.label}
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Color Scheme */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Color Scheme</h3>
                      <div className="flex gap-3">
                        {['blue', 'purple', 'green', 'orange', 'red'].map((color) => (
                          <motion.button
                            key={color}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setPreferences(prev => ({ ...prev, colorScheme: color as any }))}
                            className={`w-8 h-8 rounded-full bg-gradient-to-r ${getColorSchemeClasses(color)} ${
                              preferences.colorScheme === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Font Size */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Font Size</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {['small', 'medium', 'large'].map((size) => (
                          <motion.button
                            key={size}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setPreferences(prev => ({ ...prev, fontSize: size as any }))}
                            className={`p-3 rounded-lg border transition-all capitalize ${
                              preferences.fontSize === size
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                            }`}
                          >
                            {size}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Animation Toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Animations</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Enable smooth transitions and effects</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPreferences(prev => ({ ...prev, animationsEnabled: !prev.animationsEnabled }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          preferences.animationsEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <motion.div
                          animate={{ x: preferences.animationsEnabled ? 24 : 0 }}
                          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                        />
                      </motion.button>
                    </div>
                  </div>
                )}

                {activeTab === 'layout' && (
                  <div className="space-y-6">
                    {/* Layout Style */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Layout Style</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'grid', label: 'Grid', icon: Grid },
                          { value: 'list', label: 'List', icon: List },
                          { value: 'compact', label: 'Compact', icon: Smartphone }
                        ].map((layout) => {
                          const Icon = layout.icon
                          return (
                            <motion.button
                              key={layout.value}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setPreferences(prev => ({ ...prev, layout: layout.value as any }))}
                              className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                                preferences.layout === layout.value
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                              }`}
                            >
                              <Icon size={20} />
                              {layout.label}
                            </motion.button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Compact Mode */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Compact Mode</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Reduce spacing and component sizes</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPreferences(prev => ({ ...prev, compactMode: !prev.compactMode }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          preferences.compactMode ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <motion.div
                          animate={{ x: preferences.compactMode ? 24 : 0 }}
                          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                        />
                      </motion.button>
                    </div>
                  </div>
                )}

                {activeTab === 'widgets' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard Widgets</h3>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={createCustomDashboard}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        Create Custom Dashboard
                      </motion.button>
                    </div>
                    
                    <Reorder.Group axis="y" values={widgets} onReorder={setWidgets} className="space-y-3">
                      {widgets.map((widget) => {
                        const Icon = widget.icon
                        return (
                          <Reorder.Item key={widget.id} value={widget}>
                            <motion.div
                              whileHover={{ scale: 1.01 }}
                              className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                            >
                              <Icon size={20} className="text-gray-600 dark:text-gray-400" />
                              
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 dark:text-white">{widget.name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                  {widget.category} • {widget.size}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <select
                                  value={widget.size}
                                  onChange={(e) => updateWidgetSize(widget.id, e.target.value as any)}
                                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                  <option value="small">Small</option>
                                  <option value="medium">Medium</option>
                                  <option value="large">Large</option>
                                </select>

                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => toggleWidget(widget.id)}
                                  className={`relative w-10 h-5 rounded-full transition-colors ${
                                    widget.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                  }`}
                                >
                                  <motion.div
                                    animate={{ x: widget.enabled ? 20 : 0 }}
                                    className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md"
                                  />
                                </motion.button>
                              </div>
                            </motion.div>
                          </Reorder.Item>
                        )
                      })}
                    </Reorder.Group>
                  </div>
                )}

                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    {/* Notifications */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Get alerts for important updates</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPreferences(prev => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          preferences.notificationsEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <motion.div
                          animate={{ x: preferences.notificationsEnabled ? 24 : 0 }}
                          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                        />
                      </motion.button>
                    </div>

                    {/* Auto Refresh */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Auto Refresh</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Automatically update data</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPreferences(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          preferences.autoRefresh ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <motion.div
                          animate={{ x: preferences.autoRefresh ? 24 : 0 }}
                          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                        />
                      </motion.button>
                    </div>

                    {/* Refresh Interval */}
                    {preferences.autoRefresh && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          Refresh Interval: {preferences.refreshInterval}s
                        </h3>
                        <input
                          type="range"
                          min="60"
                          max="600"
                          step="60"
                          value={preferences.refreshInterval}
                          onChange={(e) => setPreferences(prev => ({ ...prev, refreshInterval: parseInt(e.target.value) }))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                          <span>1 min</span>
                          <span>10 min</span>
                        </div>
                      </div>
                    )}

                    {/* Language */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Language</h3>
                      <select
                        value={preferences.language}
                        onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                      </select>
                    </div>

                    {/* Reset Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={resetPreferences}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <RotateCcw size={16} />
                      Reset to Defaults
                    </motion.button>
                  </div>
                )}

                {activeTab === 'export' && (
                  <div className="space-y-6">
                    {/* Export Settings */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Export Settings</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Save your customizations and preferences to a file
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={exportSettings}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Download size={16} />
                        Export Settings
                      </motion.button>
                    </div>

                    {/* Import Settings */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Import Settings</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Load previously saved customizations
                      </p>
                      <label className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors cursor-pointer">
                        <Upload size={16} />
                        Import Settings
                        <input
                          type="file"
                          accept=".json"
                          onChange={importSettings}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Custom Dashboards */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Custom Dashboards</h3>
                      <div className="space-y-2">
                        {customDashboards.map((dashboard) => (
                          <div
                            key={dashboard.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">{dashboard.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {dashboard.widgets.length} widgets • {dashboard.isDefault ? 'Default' : 'Custom'}
                              </p>
                            </div>
                            {!dashboard.isDefault && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setCustomDashboards(prev => prev.filter(d => d.id !== dashboard.id))}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                ✕
                              </motion.button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default UserCustomization