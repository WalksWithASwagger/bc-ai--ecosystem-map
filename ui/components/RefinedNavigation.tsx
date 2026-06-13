'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  UserGroupIcon,
  GlobeAltIcon,
  LightBulbIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  description?: string
}

const RefinedNavigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      description: 'Overview and key metrics'
    },
    {
      name: 'Organizations',
      href: '/dashboard/organizations',
      icon: BuildingOfficeIcon,
      badge: '1,450',
      description: 'Company database'
    },
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: ChartBarIcon,
      description: 'Data insights and trends'
    },
    {
      name: 'Research',
      href: '/dashboard/research',
      icon: LightBulbIcon,
      badge: 'AI',
      description: 'Innovation tracking'
    },
    {
      name: 'Network',
      href: '/dashboard/network',
      icon: UserGroupIcon,
      description: 'Ecosystem connections'
    },
    {
      name: 'Global',
      href: '/dashboard/global',
      icon: GlobeAltIcon,
      description: 'International presence'
    },
    {
      name: 'Search',
      href: '/dashboard/search',
      icon: MagnifyingGlassIcon,
      description: 'Advanced search tools'
    },
    {
      name: 'Reports',
      href: '/dashboard/reports',
      icon: DocumentTextIcon,
      description: 'Generate insights'
    }
  ]

  const bottomNavigation: NavigationItem[] = [
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Cog6ToothIcon,
      description: 'Preferences'
    },
    {
      name: 'Sign Out',
      href: '/logout',
      icon: ArrowRightOnRectangleIcon,
      description: 'Exit dashboard'
    }
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const NavItem: React.FC<{ item: NavigationItem; isBottom?: boolean }> = ({ item, isBottom = false }) => (
    <Link href={item.href}>
      <motion.div
        className={`group flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          isActive(item.href)
            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }`}
        whileHover={{ x: 2 }}
        transition={{ duration: 0.2 }}
      >
        <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
          isActive(item.href) ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
        }`} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="truncate">{item.name}</span>
            {item.badge && (
              <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                isActive(item.href)
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {item.badge}
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-gray-500 mt-0.5 group-hover:text-gray-600">
              {item.description}
            </p>
          )}
        </div>
      </motion.div>
    </Link>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BC</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">AI Ecosystem</h1>
                <p className="text-xs text-gray-600">Strategic Intelligence</p>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <div className="flex-1 flex flex-col">
            <nav className="flex-1 px-3 space-y-1">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </nav>
            
            {/* Bottom Navigation */}
            <div className="border-t border-gray-200 pt-4 pb-4">
              <nav className="px-3 space-y-1">
                {bottomNavigation.map((item) => (
                  <NavItem key={item.name} item={item} isBottom />
                ))}
              </nav>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BC</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">AI Ecosystem</h1>
            </div>
          </div>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 bg-gray-600 bg-opacity-50 z-20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
              />
              
              {/* Menu Panel */}
              <motion.div
                className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-30"
                initial={{ x: -264 }}
                animate={{ x: 0 }}
                exit={{ x: -264 }}
                transition={{ type: "spring" as const, damping: 25, stiffness: 200 }}
              >
                <div className="flex flex-col h-full pt-4">
                  <nav className="flex-1 px-3 space-y-1">
                    {navigation.map((item) => (
                      <div key={item.name} onClick={() => setIsMobileMenuOpen(false)}>
                        <NavItem item={item} />
                      </div>
                    ))}
                  </nav>
                  
                  {/* Bottom Navigation */}
                  <div className="border-t border-gray-200 pt-4 pb-4">
                    <nav className="px-3 space-y-1">
                      {bottomNavigation.map((item) => (
                        <div key={item.name} onClick={() => setIsMobileMenuOpen(false)}>
                          <NavItem item={item} isBottom />
                        </div>
                      ))}
                    </nav>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}

export default RefinedNavigation