'use client';

import { MapPin, Globe, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Organization } from '../types';

interface MapFallbackProps {
  organizations: Organization[];
  selectedOrganization?: Organization | null;
  onOrganizationClick?: (org: Organization) => void;
}

export default function MapFallback({ organizations, selectedOrganization, onOrganizationClick }: MapFallbackProps) {
  // Group organizations by region
  const regionData = organizations.reduce((acc: { [key: string]: Organization[] }, org) => {
    const region = org.bcRegion || 'Unknown';
    if (!acc[region]) acc[region] = [];
    acc[region].push(org);
    return acc;
  }, {});

  const mappableOrgs = organizations.filter(org => 
    org.latitude !== null && org.longitude !== null
  );

  return (
    <div className="w-full h-96 bg-black/30 rounded-lg border border-cyber-border/30 overflow-hidden relative">
      {/* Header */}
      <div className="bg-black/50 border-b border-cyber-border/30 p-4">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-neon-blue" />
          <div className="text-neon-blue font-mono text-sm">
            GEOGRAPHIC.DISTRIBUTION
          </div>
          <div className="ml-auto text-terminal-gray font-mono text-xs">
            {mappableOrgs.length}/{organizations.length} mapped
          </div>
        </div>
      </div>

      {/* Regional Grid */}
      <div className="p-4 h-full overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(regionData)
            .sort(([, a], [, b]) => b.length - a.length)
            .slice(0, 6)
            .map(([region, orgs]) => (
              <motion.div
                key={region}
                className="bg-black/40 backdrop-blur-sm p-4 rounded-lg border border-cyber-border/20 hover:border-neon-green/30 transition-all duration-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-4 h-4 text-neon-green" />
                  <h3 className="text-neon-green font-mono text-sm font-bold">
                    {region}
                  </h3>
                </div>
                
                <div className="text-terminal-gray font-mono text-xs mb-3">
                  {orgs.length} entities
                </div>

                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {orgs.slice(0, 3).map((org) => (
                    <motion.div
                      key={org.id}
                      className={`p-2 rounded border cursor-pointer text-xs transition-all duration-200 ${
                        selectedOrganization?.id === org.id
                          ? 'border-neon-blue bg-neon-blue/10 text-neon-blue'
                          : 'border-cyber-border/20 bg-black/20 text-terminal-gray hover:border-neon-blue/30 hover:text-neon-blue'
                      }`}
                      onClick={() => onOrganizationClick?.(org)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="font-mono font-bold truncate">
                        {org.name}
                      </div>
                      {org.city && (
                        <div className="text-terminal-muted text-xs truncate">
                          📍 {org.city}
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {orgs.length > 3 && (
                    <div className="text-terminal-muted text-xs text-center py-1">
                      +{orgs.length - 3} more organizations
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
        </div>

        {/* Map unavailable notice */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-terminal-yellow/10 border border-terminal-yellow/30 rounded-lg">
            <div className="w-2 h-2 bg-terminal-yellow rounded-full animate-pulse"></div>
            <span className="text-terminal-yellow font-mono text-xs">
              Interactive map module temporarily unavailable - showing regional distribution
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}