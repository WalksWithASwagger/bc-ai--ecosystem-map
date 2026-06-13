// Comprehensive monitoring and analytics system for BC AI Ecosystem Atlas
'use client';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private errors: Array<{ timestamp: number; error: Error; context?: any }> = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Track Core Web Vitals
  trackWebVitals() {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    this.observePerformanceEntry('largest-contentful-paint', (entry) => {
      this.recordMetric('LCP', entry.startTime);
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 LCP: ${entry.startTime.toFixed(2)}ms`);
      }
    });

    // First Input Delay (FID)
    this.observePerformanceEntry('first-input', (entry) => {
      const fid = entry.processingStart - entry.startTime;
      this.recordMetric('FID', fid);
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ FID: ${fid.toFixed(2)}ms`);
      }
    });

    // Cumulative Layout Shift (CLS)
    this.observePerformanceEntry('layout-shift', (entry) => {
      if (!entry.hadRecentInput) {
        this.recordMetric('CLS', entry.value);
        if (process.env.NODE_ENV === 'development') {
          console.log(`📐 CLS: ${entry.value.toFixed(4)}`);
        }
      }
    });
  }

  // Track search performance
  trackSearchPerformance(query: string, startTime: number, resultsCount: number) {
    const duration = performance.now() - startTime;
    this.recordMetric('search_duration', duration);
    
    // Log search analytics
    const searchData = {
      query,
      duration: Math.round(duration),
      resultsCount,
      timestamp: Date.now()
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 Search Performance:`, searchData);
    }
    
    // Store in localStorage for analytics
    this.storeSearchAnalytics(searchData);
    
    return duration;
  }

  // Track API performance
  trackAPICall(endpoint: string, startTime: number, success: boolean, error?: Error) {
    const duration = performance.now() - startTime;
    const metricKey = `api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    this.recordMetric(metricKey, duration);
    
    const apiData = {
      endpoint,
      duration: Math.round(duration),
      success,
      error: error?.message,
      timestamp: Date.now()
    };

    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 API Call:`, apiData);
    }
    
    if (error) {
      this.recordError(error, { endpoint, duration });
    }

    return duration;
  }

  // Record custom metrics
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
    
    // Keep only last 100 measurements
    const values = this.metrics.get(name)!;
    if (values.length > 100) {
      values.shift();
    }
  }

  // Record errors
  recordError(error: Error, context?: any) {
    const errorRecord = {
      timestamp: Date.now(),
      error,
      context
    };
    
    this.errors.push(errorRecord);
    
    // Keep only last 50 errors
    if (this.errors.length > 50) {
      this.errors.shift();
    }

    console.error('🚨 Error recorded:', errorRecord);
    
    // Store critical errors in localStorage
    if (this.isCriticalError(error)) {
      this.storeCriticalError(errorRecord);
    }
  }

  // Get performance summary
  getPerformanceSummary() {
    const summary: Record<string, any> = {};
    
    for (const [metric, values] of Array.from(this.metrics.entries())) {
      if (values.length === 0) continue;
      
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      const p95 = this.percentile(values, 95);
      
      summary[metric] = {
        average: Math.round(avg * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        p95: Math.round(p95 * 100) / 100,
        count: values.length
      };
    }
    
    return summary;
  }

  // Get error summary
  getErrorSummary() {
    const now = Date.now();
    const last24h = this.errors.filter(e => now - e.timestamp < 24 * 60 * 60 * 1000);
    const lastHour = this.errors.filter(e => now - e.timestamp < 60 * 60 * 1000);
    
    return {
      total: this.errors.length,
      last24h: last24h.length,
      lastHour: lastHour.length,
      recent: this.errors.slice(-5).map(e => ({
        message: e.error.message,
        timestamp: new Date(e.timestamp).toISOString(),
        context: e.context
      }))
    };
  }

  // Private helper methods
  private observePerformanceEntry(type: string, callback: (entry: any) => void) {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry);
        }
      });
      observer.observe({ type, buffered: true });
    } catch (error) {
      console.warn(`Could not observe ${type}:`, error);
    }
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((sorted.length * p) / 100) - 1;
    return sorted[Math.max(0, index)];
  }

  private isCriticalError(error: Error): boolean {
    const criticalPatterns = [
      /network/i,
      /failed to fetch/i,
      /notion api/i,
      /render/i,
      /maximum update depth/i
    ];
    
    return criticalPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.stack || '')
    );
  }

  private storeSearchAnalytics(data: any) {
    try {
      const existing = JSON.parse(localStorage.getItem('search_analytics') || '[]');
      existing.push(data);
      
      // Keep only last 100 searches
      if (existing.length > 100) {
        existing.splice(0, existing.length - 100);
      }
      
      localStorage.setItem('search_analytics', JSON.stringify(existing));
    } catch (error) {
      console.warn('Could not store search analytics:', error);
    }
  }

  private storeCriticalError(errorRecord: any) {
    try {
      const existing = JSON.parse(localStorage.getItem('critical_errors') || '[]');
      existing.push({
        message: errorRecord.error.message,
        stack: errorRecord.error.stack,
        timestamp: errorRecord.timestamp,
        context: errorRecord.context
      });
      
      // Keep only last 20 critical errors
      if (existing.length > 20) {
        existing.splice(0, existing.length - 20);
      }
      
      localStorage.setItem('critical_errors', JSON.stringify(existing));
    } catch (error) {
      console.warn('Could not store critical error:', error);
    }
  }
}

// User behavior analytics
export class UserAnalytics {
  private static instance: UserAnalytics;
  private sessionStart: number = Date.now();
  private pageViews: number = 0;
  private interactions: Array<{ type: string; timestamp: number; data?: any }> = [];

  static getInstance(): UserAnalytics {
    if (!UserAnalytics.instance) {
      UserAnalytics.instance = new UserAnalytics();
    }
    return UserAnalytics.instance;
  }

  // Track page view
  trackPageView(page: string) {
    this.pageViews++;
    const event = {
      type: 'page_view',
      timestamp: Date.now(),
      data: { page, sessionPageViews: this.pageViews }
    };
    
    this.interactions.push(event);
    if (process.env.NODE_ENV === 'development') {
      console.log('📄 Page View:', event);
    }
  }

  // Track user interactions
  trackInteraction(type: string, data?: any) {
    const event = {
      type,
      timestamp: Date.now(),
      data
    };
    
    this.interactions.push(event);
    
    // Keep only last 200 interactions
    if (this.interactions.length > 200) {
      this.interactions.shift();
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('👆 User Interaction:', event);
    }
  }

  // Track search behavior
  trackSearch(query: string, resultsCount: number, filters?: any) {
    this.trackInteraction('search', {
      query,
      resultsCount,
      filters,
      queryLength: query.length
    });
  }

  // Track organization interactions
  trackOrganizationView(organizationId: string, organizationName: string) {
    this.trackInteraction('organization_view', {
      organizationId,
      organizationName
    });
  }

  // Track filter usage
  trackFilterUsage(filterType: string, filterValue: any) {
    this.trackInteraction('filter_usage', {
      filterType,
      filterValue
    });
  }

  // Get session summary
  getSessionSummary() {
    const now = Date.now();
    const sessionDuration = now - this.sessionStart;
    
    const searchCount = this.interactions.filter(i => i.type === 'search').length;
    const organizationViews = this.interactions.filter(i => i.type === 'organization_view').length;
    const filterUsage = this.interactions.filter(i => i.type === 'filter_usage').length;
    
    return {
      sessionDuration: Math.round(sessionDuration / 1000), // in seconds
      pageViews: this.pageViews,
      totalInteractions: this.interactions.length,
      searchCount,
      organizationViews,
      filterUsage,
      averageTimePerPage: this.pageViews > 0 ? Math.round(sessionDuration / this.pageViews / 1000) : 0
    };
  }
}

// Initialize monitoring on client side
export function initializeMonitoring() {
  if (typeof window === 'undefined') return;

  const perfMonitor = PerformanceMonitor.getInstance();
  const userAnalytics = UserAnalytics.getInstance();

  // Start performance monitoring
  perfMonitor.trackWebVitals();
  
  // Track initial page view
  userAnalytics.trackPageView(window.location.pathname);

  // Global error handler
  window.addEventListener('error', (event) => {
    perfMonitor.recordError(event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    perfMonitor.recordError(new Error(event.reason), {
      type: 'unhandled_promise_rejection'
    });
  });

  // Track page visibility changes
  document.addEventListener('visibilitychange', () => {
    userAnalytics.trackInteraction('visibility_change', {
      hidden: document.hidden
    });
  });

  // Periodic reporting (every 30 seconds)
  setInterval(() => {
    const perfSummary = perfMonitor.getPerformanceSummary();
    const sessionSummary = userAnalytics.getSessionSummary();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Performance Summary:', perfSummary);
      console.log('👤 Session Summary:', sessionSummary);
    }
  }, 30000);

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Monitoring initialized successfully');
  }
  
  return { perfMonitor, userAnalytics };
}

// Export singleton instances
export const performanceMonitor = PerformanceMonitor.getInstance();
export const userAnalytics = UserAnalytics.getInstance();