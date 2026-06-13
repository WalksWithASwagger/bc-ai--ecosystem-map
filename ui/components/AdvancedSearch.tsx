'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  MapPin, 
  Calendar, 
  Users, 
  Building2, 
  Brain,
  Target,
  Sliders,
  Clock
} from 'lucide-react';
import { useFloating, autoUpdate, offset, flip, shift } from '@floating-ui/react';

interface SearchSuggestion {
  id: string;
  type: 'organization' | 'category' | 'region' | 'ai_focus' | 'city';
  text: string;
  highlight?: string;
  count?: number;
}

interface SearchFilters {
  region: string;
  category: string;
  sizeRange: string;
  yearRange: [number, number];
  locationRadius: number;
  centerLat?: number;
  centerLng?: number;
}

interface AdvancedSearchProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  suggestions: SearchSuggestion[];
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  selectSuggestion: (suggestion: SearchSuggestion) => void;
  clearSearch: () => void;
  resultsCount: number;
  regionOptions: { value: string; label: string; count: number }[];
  categoryOptions: { value: string; label: string; count: number }[];
  onLocationSelect?: (lat: number, lng: number) => void;
}

const getSuggestionIcon = (type: string) => {
  switch (type) {
    case 'organization': return Building2;
    case 'category': return Filter;
    case 'region': return MapPin;
    case 'ai_focus': return Brain;
    case 'city': return Target;
    default: return Search;
  }
};

const getSuggestionColor = (type: string) => {
  switch (type) {
    case 'organization': return 'text-ai-electric-400';
    case 'category': return 'text-ai-neon-400';
    case 'region': return 'text-ai-emerald-400';
    case 'ai_focus': return 'text-ai-amber-400';
    case 'city': return 'text-pink-400';
    default: return 'text-gray-400';
  }
};

export default function AdvancedSearch({
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  suggestions,
  showSuggestions,
  setShowSuggestions,
  selectSuggestion,
  clearSearch,
  resultsCount,
  regionOptions,
  categoryOptions,
  onLocationSelect
}: AdvancedSearchProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isLocationPicking, setIsLocationPicking] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Floating UI for suggestions dropdown
  const { refs, floatingStyles } = useFloating({
    open: showSuggestions,
    onOpenChange: setShowSuggestions,
    middleware: [offset(8), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  // Handle keyboard navigation in suggestions
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          selectSuggestion(suggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Active filters count
  const activeFiltersCount = [
    filters.region !== 'all',
    filters.category !== 'all',
    filters.sizeRange !== 'all',
    filters.yearRange[0] !== 1990 || filters.yearRange[1] !== new Date().getFullYear(),
    filters.locationRadius > 0
  ].filter(Boolean).length;

  return (
    <motion.div
      className="bg-white/80 dark:bg-ai-dark-200/60 backdrop-blur-sm p-8 rounded-2xl shadow-ai-card border border-white/20 dark:border-ai-dark-300/30 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0, duration: 0.6 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-ai-electric-400/20 to-ai-neon-400/20">
            <Search className="w-5 h-5 text-ai-electric-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Advanced Search</h2>
          {activeFiltersCount > 0 && (
            <motion.span
              className="px-2 py-1 text-xs font-medium bg-ai-electric-400/20 text-ai-electric-600 dark:text-ai-electric-400 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
            </motion.span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
              showAdvancedFilters 
                ? 'bg-ai-neon-500 text-white shadow-lg' 
                : 'bg-white/50 dark:bg-ai-dark-300/30 text-gray-700 dark:text-ai-dark-400 hover:bg-ai-neon-400/20'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sliders className="w-4 h-4" />
            Filters
          </motion.button>
          
          {(searchTerm || activeFiltersCount > 0) && (
            <motion.button
              onClick={clearSearch}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-ai-dark-300/30 text-gray-600 dark:text-ai-dark-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <X className="w-4 h-4" />
              Clear
            </motion.button>
          )}
        </div>
      </div>

      {/* Main Search Input */}
      <div className="relative mb-6" ref={refs.setReference}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-ai-dark-400 w-5 h-5" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search organizations, categories, AI focus areas..."
            className="w-full pl-12 pr-12 py-4 bg-white/50 dark:bg-ai-dark-300/30 backdrop-blur-sm border border-gray-200 dark:border-ai-dark-300/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-ai-electric-500 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-ai-dark-400 text-lg"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
              setSelectedSuggestionIndex(-1);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
          />
          {searchTerm && (
            <motion.button
              onClick={() => {
                setSearchTerm('');
                setShowSuggestions(false);
                searchInputRef.current?.focus();
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-ai-dark-300 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          )}
        </div>

        {/* Search Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              ref={refs.setFloating}
              style={floatingStyles}
              className="z-50 w-full max-w-2xl bg-white/95 dark:bg-ai-dark-200/95 backdrop-blur-xl border border-white/20 dark:border-ai-dark-300/30 rounded-xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-2 max-h-96 overflow-y-auto">
                {suggestions.map((suggestion, index) => {
                  const Icon = getSuggestionIcon(suggestion.type);
                  const isSelected = index === selectedSuggestionIndex;
                  
                  return (
                    <motion.button
                      key={suggestion.id}
                      onClick={() => selectSuggestion(suggestion)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 ${
                        isSelected
                          ? 'bg-ai-electric-400/20 text-ai-electric-600 dark:text-ai-electric-400'
                          : 'hover:bg-gray-100/50 dark:hover:bg-ai-dark-300/30'
                      }`}
                      whileHover={{ x: 4 }}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className={`p-1.5 rounded-lg bg-gradient-to-r from-white/20 to-white/10 ${getSuggestionColor(suggestion.type)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div 
                          className="font-medium text-gray-900 dark:text-white"
                          dangerouslySetInnerHTML={{ 
                            __html: suggestion.highlight || suggestion.text 
                          }}
                        />
                        <div className="text-xs text-gray-500 dark:text-ai-dark-400 capitalize">
                          {suggestion.type.replace('_', ' ')}
                          {suggestion.count && ` • ${suggestion.count} org${suggestion.count !== 1 ? 's' : ''}`}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Count */}
      <motion.div
        className="flex items-center gap-2 mb-6 text-gray-600 dark:text-ai-dark-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <Target className="w-4 h-4" />
        <span className="font-medium">
          Showing {resultsCount.toLocaleString()} organization{resultsCount !== 1 ? 's' : ''}
        </span>
        {searchTerm && (
          <span className="text-ai-electric-500">
            for "{searchTerm}"
          </span>
        )}
      </motion.div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            className="border-t border-gray-200 dark:border-ai-dark-300/30 pt-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Region Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-ai-dark-400 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  BC Region
                </label>
                <select
                  className="w-full px-3 py-2 bg-white/50 dark:bg-ai-dark-300/30 border border-gray-200 dark:border-ai-dark-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-electric-500 text-gray-900 dark:text-white text-sm"
                  value={filters.region}
                  onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                >
                  <option value="all">All Regions</option>
                  {regionOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-ai-dark-400 mb-2">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Category
                </label>
                <select
                  className="w-full px-3 py-2 bg-white/50 dark:bg-ai-dark-300/30 border border-gray-200 dark:border-ai-dark-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-electric-500 text-gray-900 dark:text-white text-sm"
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                >
                  <option value="all">All Categories</option>
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Company Size Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-ai-dark-400 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Company Size
                </label>
                <select
                  className="w-full px-3 py-2 bg-white/50 dark:bg-ai-dark-300/30 border border-gray-200 dark:border-ai-dark-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-electric-500 text-gray-900 dark:text-white text-sm"
                  value={filters.sizeRange}
                  onChange={(e) => setFilters({ ...filters, sizeRange: e.target.value })}
                >
                  <option value="all">All Sizes</option>
                  <option value="startup">Startup (1-10)</option>
                  <option value="small">Small (11-50)</option>
                  <option value="medium">Medium (51-200)</option>
                  <option value="large">Large (201+)</option>
                </select>
              </div>

              {/* Founded Year Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-ai-dark-400 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Founded Year
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="From"
                    className="w-full px-2 py-2 bg-white/50 dark:bg-ai-dark-300/30 border border-gray-200 dark:border-ai-dark-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-electric-500 text-gray-900 dark:text-white text-sm"
                    value={filters.yearRange[0]}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      yearRange: [parseInt(e.target.value) || 1990, filters.yearRange[1]] 
                    })}
                    min="1990"
                    max={new Date().getFullYear()}
                  />
                  <input
                    type="number"
                    placeholder="To"
                    className="w-full px-2 py-2 bg-white/50 dark:bg-ai-dark-300/30 border border-gray-200 dark:border-ai-dark-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-ai-electric-500 text-gray-900 dark:text-white text-sm"
                    value={filters.yearRange[1]}
                    onChange={(e) => setFilters({ 
                      ...filters, 
                      yearRange: [filters.yearRange[0], parseInt(e.target.value) || new Date().getFullYear()] 
                    })}
                    min="1990"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
            </div>

            {/* Location Radius Filter */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-ai-dark-400">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location Radius: {filters.locationRadius > 0 ? `${filters.locationRadius}km` : 'Disabled'}
                </label>
                {filters.locationRadius > 0 && (
                  <button
                    onClick={() => setFilters({ ...filters, locationRadius: 0, centerLat: undefined, centerLng: undefined })}
                    className="text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    Clear location filter
                  </button>
                )}
              </div>
              <div className="flex gap-4 items-center">
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={filters.locationRadius}
                  onChange={(e) => setFilters({ ...filters, locationRadius: parseInt(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 dark:bg-ai-dark-300 rounded-lg appearance-none cursor-pointer"
                  disabled={!filters.centerLat || !filters.centerLng}
                />
                <motion.button
                  onClick={() => setIsLocationPicking(!isLocationPicking)}
                  className={`px-3 py-1 text-xs rounded-lg transition-all duration-300 ${
                    isLocationPicking
                      ? 'bg-ai-electric-500 text-white'
                      : 'bg-gray-100 dark:bg-ai-dark-300/30 text-gray-600 dark:text-ai-dark-400 hover:bg-ai-electric-100'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isLocationPicking ? 'Click on map...' : 'Set center'}
                </motion.button>
              </div>
              {filters.centerLat && filters.centerLng && (
                <div className="mt-2 text-xs text-gray-500 dark:text-ai-dark-400">
                  Center: {filters.centerLat.toFixed(4)}, {filters.centerLng.toFixed(4)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Tips */}
      {!searchTerm && !showAdvancedFilters && (
        <motion.div
          className="mt-4 p-4 bg-gradient-to-r from-ai-electric-400/10 to-ai-neon-400/10 rounded-xl border border-ai-electric-400/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <div className="flex items-start gap-3">
            <div className="p-1 rounded-lg bg-ai-electric-400/20">
              <Clock className="w-4 h-4 text-ai-electric-500" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">Search Tips</h4>
              <ul className="text-sm text-gray-600 dark:text-ai-dark-400 space-y-1">
                <li>• Try searching for organization names, AI focus areas, or cities</li>
                <li>• Use advanced filters to narrow down by region, size, or founding year</li>
                <li>• Set a location radius to find organizations near a specific point</li>
                <li>• Suggestions will appear as you type to help you find what you're looking for</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
} 