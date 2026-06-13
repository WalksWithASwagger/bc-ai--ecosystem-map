'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Database, 
  Map, 
  Settings, 
  Search,
  Home,
  Trophy,
  Zap
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3, description: 'Command Center' },
  { name: 'Explorer', href: '/', icon: Map, description: 'Ecosystem Map' },
  { name: 'Companies', href: '/companies', icon: Database, description: 'Database' },
  { name: 'Intelligence', href: '/intelligence', icon: Search, description: 'Research Hub' },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <motion.nav 
      className="fixed top-6 left-6 z-50"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-2">
        <div className="flex flex-col gap-1">
          {navigation.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                <Link href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 border border-cyan-500/30' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-400 to-emerald-400 rounded-r-full"
                        layoutId="activeIndicator"
                        transition={{ type: "spring" as const, stiffness: 500, damping: 30 }}
                      />
                    )}
                    
                    <Icon className={`w-5 h-5 transition-colors duration-200 ${
                      isActive ? 'text-cyan-400' : 'group-hover:text-white'
                    }`} />
                    
                    <div className="flex flex-col">
                      <span className={`text-sm font-medium transition-colors duration-200 ${
                        isActive ? 'text-white' : 'group-hover:text-white'
                      }`}>
                        {item.name}
                      </span>
                      <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors duration-200">
                        {item.description}
                      </span>
                    </div>

                    {/* Special indicators */}
                    {item.name === 'Dashboard' && (
                      <motion.div
                        className="ml-auto"
                        animate={{
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <Zap className="w-4 h-4 text-yellow-400" />
                      </motion.div>
                    )}
                  </motion.div>
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Quick stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="mt-4 p-3 bg-slate-800/30 rounded-xl border border-slate-700/30"
        >
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Trophy className="w-3 h-3" />
            Quick Stats
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center">
              <div className="text-white font-bold">375+</div>
              <div className="text-slate-500">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold">1.4K+</div>
              <div className="text-slate-500">Updates</div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  )
}