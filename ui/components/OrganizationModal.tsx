'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, MapPin, Users, Calendar, Mail, Phone, Linkedin, Globe, Tag, Brain, Building2, Award } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  website: string;
  linkedin: string;
  email: string;
  phone: string;
  city: string;
  bcRegion: string;
  category: string;
  aiFocusAreas: string[];
  yearFounded: number | null;
  size: string;
  shortBlurb: string;
  keyPeople: string;
  latitude: number | null;
  longitude: number | null;
}

interface OrganizationModalProps {
  organization: Organization | null;
  isOpen: boolean;
  onClose: () => void;
}

const getCategoryColor = (category: string): string => {
  const colors: { [key: string]: string } = {
    'Start-ups & Scale-ups': 'from-ai-electric-400 to-ai-electric-600',
    'Academic & Research Labs': 'from-ai-emerald-400 to-ai-emerald-600',
    'Enterprise / Corporate Divisions': 'from-ai-neon-400 to-ai-neon-600',
    'Service Studios / Agencies': 'from-ai-amber-400 to-ai-amber-600',
    'Government & Public Sector': 'from-red-400 to-red-600',
    'Investors & Funds': 'from-cyan-400 to-cyan-600',
    'Non-Profit': 'from-green-400 to-green-600',
    'Grassroots Communities': 'from-pink-400 to-pink-600',
    'Indigenous Tech & Creative Orgs': 'from-orange-400 to-orange-600',
    'Industry Association': 'from-indigo-400 to-indigo-600',
  };
  return colors[category] || 'from-ai-dark-400 to-ai-dark-500';
};

const ContactItem = ({ icon: Icon, label, value, href, isExternal = false }: {
  icon: any;
  label: string;
  value: string;
  href?: string;
  isExternal?: boolean;
}) => {
  if (!value) return null;

  const content = (
    <motion.div
      className="flex items-center gap-3 p-4 bg-white/5 dark:bg-ai-dark-300/20 rounded-xl hover:bg-white/10 dark:hover:bg-ai-dark-300/30 transition-all duration-300 group cursor-pointer"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="p-2 rounded-lg bg-gradient-to-r from-ai-electric-400/20 to-ai-neon-400/20 group-hover:from-ai-electric-400/30 group-hover:to-ai-neon-400/30 transition-all duration-300">
        <Icon className="w-4 h-4 text-ai-electric-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-gray-500 dark:text-ai-dark-400 font-medium uppercase tracking-wide">
          {label}
        </div>
        <div className="text-sm text-gray-900 dark:text-white font-medium truncate">
          {value}
        </div>
      </div>
      {href && (
        <ExternalLink className="w-4 h-4 text-gray-400 dark:text-ai-dark-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </motion.div>
  );

  if (href) {
    return (
      <a
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="block"
      >
        {content}
      </a>
    );
  }

  return content;
};

export default function OrganizationModal({ organization, isOpen, onClose }: OrganizationModalProps) {
  if (!organization) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white/95 dark:bg-ai-dark-100/95 backdrop-blur-xl border-l border-white/20 dark:border-ai-dark-300/30 shadow-2xl z-50 overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 120 }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white/80 dark:bg-ai-dark-100/80 backdrop-blur-xl border-b border-white/20 dark:border-ai-dark-300/30 p-6 z-10">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <motion.h1 
                    className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {organization.name}
                  </motion.h1>
                  <motion.div
                    className="flex items-center gap-2 mb-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full bg-gradient-to-r ${getCategoryColor(organization.category)}`}>
                      {organization.category}
                    </span>
                    {organization.city && (
                      <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-ai-dark-400">
                        <MapPin className="w-3 h-3" />
                        {organization.city}, {organization.bcRegion}
                      </span>
                    )}
                  </motion.div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-white/10 dark:bg-ai-dark-200/50 hover:bg-white/20 dark:hover:bg-ai-dark-200/70 transition-all duration-300"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-ai-dark-400" />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Description */}
              {organization.shortBlurb && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-ai-electric-400" />
                    About
                  </h2>
                  <p className="text-gray-700 dark:text-ai-dark-400 leading-relaxed bg-white/5 dark:bg-ai-dark-300/20 p-4 rounded-xl">
                    {organization.shortBlurb}
                  </p>
                </motion.div>
              )}

              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-ai-electric-400" />
                  Contact Information
                </h2>
                <div className="grid gap-3">
                  <ContactItem
                    icon={Globe}
                    label="Website"
                    value={organization.website}
                    href={organization.website}
                    isExternal={true}
                  />
                  <ContactItem
                    icon={Mail}
                    label="Email"
                    value={organization.email}
                    href={organization.email ? `mailto:${organization.email}` : undefined}
                  />
                  <ContactItem
                    icon={Phone}
                    label="Phone"
                    value={organization.phone}
                    href={organization.phone ? `tel:${organization.phone}` : undefined}
                  />
                  <ContactItem
                    icon={Linkedin}
                    label="LinkedIn"
                    value={organization.linkedin}
                    href={organization.linkedin}
                    isExternal={true}
                  />
                </div>
              </motion.div>

              {/* Organization Details */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-ai-electric-400" />
                  Organization Details
                </h2>
                <div className="grid gap-3">
                  {organization.yearFounded && (
                    <div className="flex items-center gap-3 p-4 bg-white/5 dark:bg-ai-dark-300/20 rounded-xl">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-ai-emerald-400/20 to-ai-emerald-600/20">
                        <Calendar className="w-4 h-4 text-ai-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-ai-dark-400 font-medium uppercase tracking-wide">
                          Founded
                        </div>
                        <div className="text-sm text-gray-900 dark:text-white font-medium">
                          {organization.yearFounded}
                        </div>
                      </div>
                    </div>
                  )}
                  {organization.size && (
                    <div className="flex items-center gap-3 p-4 bg-white/5 dark:bg-ai-dark-300/20 rounded-xl">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-ai-neon-400/20 to-ai-neon-600/20">
                        <Users className="w-4 h-4 text-ai-neon-400" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-ai-dark-400 font-medium uppercase tracking-wide">
                          Company Size
                        </div>
                        <div className="text-sm text-gray-900 dark:text-white font-medium">
                          {organization.size}
                        </div>
                      </div>
                    </div>
                  )}
                  {organization.keyPeople && (
                    <div className="flex items-center gap-3 p-4 bg-white/5 dark:bg-ai-dark-300/20 rounded-xl">
                      <div className="p-2 rounded-lg bg-gradient-to-r from-ai-amber-400/20 to-ai-amber-600/20">
                        <Users className="w-4 h-4 text-ai-amber-400" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-ai-dark-400 font-medium uppercase tracking-wide">
                          Key People
                        </div>
                        <div className="text-sm text-gray-900 dark:text-white font-medium">
                          {organization.keyPeople}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* AI Focus Areas */}
              {organization.aiFocusAreas && organization.aiFocusAreas.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-ai-electric-400" />
                    AI Focus Areas
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {organization.aiFocusAreas.map((area, index) => (
                      <motion.span
                        key={area}
                        className="px-3 py-2 text-xs font-medium text-ai-electric-400 bg-ai-electric-400/10 border border-ai-electric-400/20 rounded-lg hover:bg-ai-electric-400/20 transition-colors duration-300"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Tag className="w-3 h-3 inline mr-1" />
                        {area}
                      </motion.span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Location Map Preview */}
              {organization.latitude && organization.longitude && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-ai-electric-400" />
                    Location
                  </h2>
                  <div className="bg-white/5 dark:bg-ai-dark-300/20 rounded-xl p-4">
                    <div className="text-sm text-gray-700 dark:text-ai-dark-400 mb-2">
                      📍 {organization.city}, {organization.bcRegion}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-ai-dark-400">
                      Lat: {organization.latitude.toFixed(6)}, Lng: {organization.longitude.toFixed(6)}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 