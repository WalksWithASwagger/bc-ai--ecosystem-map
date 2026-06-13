// Shared TypeScript interfaces for the BC AI Ecosystem Atlas

export interface Organization {
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

export interface SearchFilters {
  region: string;
  category: string;
  sizeRange: string;
  yearRange: [number, number];
  locationRadius: number;
  centerLat?: number;
  centerLng?: number;
}

export interface SearchSuggestion {
  id: string;
  type: 'organization' | 'category' | 'region' | 'ai_focus' | 'city';
  text: string;
  highlight?: string;
  count?: number;
}

export interface SearchAnalytics {
  query: string;
  timestamp: number;
  resultsCount: number;
  filters: Partial<SearchFilters>;
  selectedSuggestion?: SearchSuggestion;
}

export interface Stats {
  byRegion: Record<string, number>;
  byCategory: Record<string, number>;
  withWebsite: number;
  withLinkedIn: number;
  withEmail: number;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export interface SearchCacheConfig {
  maxSize: number;
  defaultTTL: number; // Time to live in milliseconds
}

export interface CacheStats {
  hitRate: number;
  size: number;
}

// Notion API response types for better type safety
export interface NotionPropertyResponse {
  type: string;
  id: string;
  [key: string]: any;
}

export interface NotionPageResponse {
  id: string;
  properties: Record<string, NotionPropertyResponse>;
  [key: string]: any;
}