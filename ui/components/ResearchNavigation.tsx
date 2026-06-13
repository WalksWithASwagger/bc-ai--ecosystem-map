'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Search, 
  BarChart3, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  Database,
  Zap,
  Target,
  Eye,
  Brain
} from 'lucide-react';
import ProjectSelector from './ProjectSelector';

const navigationItems = [
  {
    name: 'Overview',
    href: '/research',
    icon: Activity,
    description: 'Main dashboard and pipeline status'
  },
  {
    name: 'Streamlined',
    href: '/research/streamlined',
    icon: Target,
    description: 'Data-dense professional interface'
  },
  {
    name: 'Temporal Graph',
    href: '/research/temporal',
    icon: Brain,
    description: 'Multi-hop reasoning over ecosystem timeline'
  },
  {
    name: 'Analytics',
    href: '/research/analytics',
    icon: BarChart3,
    description: 'Trends, insights, and performance metrics'
  },
  {
    name: 'Discoveries',
    href: '/research/discoveries',
    icon: Search,
    description: 'Browse and manage all findings'
  },
  {
    name: 'Intelligence',
    href: '/research/intelligence',
    icon: Target,
    description: 'Competitive and market intelligence'
  },
  {
    name: 'Approval Queue',
    href: '/research/approval',
    icon: CheckCircle,
    description: 'Review discoveries before database import'
  },
  {
    name: 'Alerts',
    href: '/research/alerts',
    icon: AlertTriangle,
    description: 'Priority notifications and actions'
  }
];

export default function ResearchNavigation() {
  const pathname = usePathname();
  const [currentProject, setCurrentProject] = React.useState<string>('bc-ai-ecosystem');

  return (
    <nav className="bg-black/40 backdrop-blur-sm border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <Database className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Research Intelligence</h1>
                <p className="text-xs text-gray-400">Command Center</p>
              </div>
            </div>
            
            {/* Project Selector */}
            <ProjectSelector 
              currentProject={currentProject}
              onProjectChange={setCurrentProject}
            />
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      isActive
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                    
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-purple-600/10 rounded-lg border border-purple-500/20"
                        initial={false}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <Zap className="w-4 h-4 animate-pulse" />
              <span className="hidden sm:inline">3 Active Pipelines</span>
            </div>
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">23 Pending</span>
            </div>
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm ${
                      isActive
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}