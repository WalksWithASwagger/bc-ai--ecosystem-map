'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import Fuse from 'fuse.js';
import type { 
  Organization, 
  SearchFilters, 
  SearchSuggestion, 
  SearchAnalytics,
  CacheStats 
} from '../types';
import { performanceMonitor, userAnalytics } from '../lib/monitoring';

const DEFAULT_FILTERS: SearchFilters = {
  region: 'all',
  category: 'all',
  sizeRange: 'all',
  yearRange: [1990, new Date().getFullYear()],
  locationRadius: 0,
};

export function useSearch(organizations: Organization[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 200); // Faster response for better UX
  const [filters, setFiltersState] = useState<SearchFilters>(DEFAULT_FILTERS);
  
  // Wrapper for setFilters with tracking
  const setFilters = useCallback((newFilters: Partial<SearchFilters> | ((prev: SearchFilters) => SearchFilters)) => {
    if (typeof newFilters === 'function') {
      setFiltersState(prev => {
        const updated = newFilters(prev);
        // Track filter changes
        if (typeof window !== 'undefined') {
          Object.entries(updated).forEach(([filterType, filterValue]) => {
            if (filterValue !== prev[filterType as keyof SearchFilters] && filterValue !== 'all') {
              userAnalytics.trackFilterUsage(filterType, filterValue);
            }
          });
        }
        return updated;
      });
    } else {
      setFiltersState(prev => {
        const updated = { ...prev, ...newFilters };
        // Track filter changes
        if (typeof window !== 'undefined') {
          Object.entries(newFilters).forEach(([filterType, filterValue]) => {
            if (filterValue !== 'all' && filterValue !== prev[filterType as keyof SearchFilters]) {
              userAnalytics.trackFilterUsage(filterType, filterValue);
            }
          });
        }
        return updated;
      });
    }
  }, []);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [analytics, setAnalytics] = useState<SearchAnalytics[]>([]);

  // Create Fuse instance - stable reference
  const fuse = useMemo(() => {
    if (!organizations || organizations.length === 0) return null;
    return new Fuse(organizations, {
      keys: [
        { name: 'name', weight: 3 },
        { name: 'shortBlurb', weight: 2 },
        { name: 'aiFocusAreas', weight: 2 },
        { name: 'category', weight: 1.5 },
        { name: 'city', weight: 1 },
        { name: 'keyPeople', weight: 1 },
      ],
      threshold: 0.4,
      distance: 100,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
    });
  }, [organizations]);

  // Filter organizations - memoized
  const filteredOrganizations = useMemo(() => {
    if (!organizations || organizations.length === 0) return [];

    const searchStartTime = performance.now();
    let results = [...organizations];

    // Text search
    if (debouncedSearchTerm && fuse) {
       const searchResults = fuse.search(debouncedSearchTerm);
       const matchingIds = searchResults.map(r => r.item.id);
       results = results.filter(org => matchingIds.includes(org.id));
       
       // Track search performance
       if (typeof window !== 'undefined') {
         performanceMonitor.trackSearchPerformance(
           debouncedSearchTerm, 
           searchStartTime, 
           results.length
         );
         
         // Track user search behavior
         userAnalytics.trackSearch(debouncedSearchTerm, results.length, filters);
       }
     }

    // Apply filters
    if (filters.region && filters.region !== 'all') {
      results = results.filter(org => org.bcRegion === filters.region);
    }

    if (filters.category && filters.category !== 'all') {
      results = results.filter(org => org.category === filters.category);
    }

    if (filters.sizeRange && filters.sizeRange !== 'all') {
      results = results.filter(org => org.size === filters.sizeRange);
    }

    // Year range filter - only apply to organizations with yearFounded data
    if (filters.yearRange) {
      const [minYear, maxYear] = filters.yearRange;
      results = results.filter(org => {
        if (!org.yearFounded) return true; // Include orgs without year data
        return org.yearFounded >= minYear && org.yearFounded <= maxYear;
      });
    }

    return results;
  }, [organizations, debouncedSearchTerm, filters, fuse]);

  // Generate suggestions - stable callback
  const generateSuggestions = useCallback(() => {
    if (!debouncedSearchTerm || debouncedSearchTerm.length < 2 || !organizations) {
      return [];
    }

    const suggestions: SearchSuggestion[] = [];
    const query = debouncedSearchTerm.toLowerCase();

    // Organization suggestions
    if (fuse) {
      const orgResults = fuse.search(debouncedSearchTerm);
      orgResults.slice(0, 3).forEach(result => {
        suggestions.push({
          id: result.item.id,
          type: 'organization',
          text: result.item.name,
          highlight: result.item.name,
        });
      });
    }

    // Category suggestions
    const categories = organizations.map(org => org.category).filter((cat, index, arr) => 
      cat && arr.indexOf(cat) === index
    );
    categories
      .filter(cat => cat.toLowerCase().includes(query))
      .slice(0, 2)
      .forEach(category => {
        suggestions.push({
          id: `category-${category}`,
          type: 'category',
          text: category,
          count: organizations.filter(org => org.category === category).length,
        });
      });

    return suggestions.slice(0, 8);
  }, [debouncedSearchTerm, organizations, fuse]);

  // Update suggestions when search term changes
  useEffect(() => {
    const newSuggestions = generateSuggestions();
    setSuggestions(newSuggestions);
  }, [generateSuggestions]);

  // Track search analytics - stable callback
  const trackSearch = useCallback((selectedSuggestion?: SearchSuggestion) => {
    const analyticsEvent: SearchAnalytics = {
      query: debouncedSearchTerm,
      timestamp: Date.now(),
      resultsCount: filteredOrganizations.length,
      filters: { ...filters },
      selectedSuggestion,
    };
    
    setAnalytics(prev => [...prev.slice(-99), analyticsEvent]);
  }, [debouncedSearchTerm, filteredOrganizations.length, filters]);

  // Select suggestion - stable callback
  const selectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case 'organization':
        setSearchTerm(suggestion.text);
        break;
      case 'category':
        setFilters(prev => ({ ...prev, category: suggestion.text }));
        setSearchTerm('');
        break;
      case 'region':
        setFilters(prev => ({ ...prev, region: suggestion.text }));
        setSearchTerm('');
        break;
      case 'ai_focus':
      case 'city':
        setSearchTerm(suggestion.text);
        break;
    }
    
    setShowSuggestions(false);
    trackSearch(suggestion);
  }, [trackSearch]);

  // Clear search - stable callback
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setFilters(DEFAULT_FILTERS);
    setShowSuggestions(false);
  }, []);

  return {
    // Search state
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    filters,
    setFilters,
    
    // Results
    filteredOrganizations,
    
    // Suggestions
    suggestions,
    showSuggestions,
    setShowSuggestions,
    selectSuggestion,
    
    // Actions
    clearSearch,
    
    // Analytics
    analytics,
    
    // Performance metrics
    getCacheStats: (): { searchResults: CacheStats; suggestions: CacheStats } => ({
      searchResults: { hitRate: 0, size: 0 },
      suggestions: { hitRate: 0, size: 0 },
    }),
  };
} 