// Analytics data export utilities
'use client';

import { performanceMonitor, userAnalytics } from './monitoring';

export interface AnalyticsReport {
  timestamp: string;
  sessionSummary: any;
  performanceSummary: any;
  errorSummary: any;
  searchAnalytics: any[];
  criticalErrors: any[];
}

export function generateAnalyticsReport(): AnalyticsReport {
  const now = new Date();
  
  const report: AnalyticsReport = {
    timestamp: now.toISOString(),
    sessionSummary: userAnalytics.getSessionSummary(),
    performanceSummary: performanceMonitor.getPerformanceSummary(),
    errorSummary: performanceMonitor.getErrorSummary(),
    searchAnalytics: getSearchAnalytics(),
    criticalErrors: getCriticalErrors()
  };

  return report;
}

export function exportAnalyticsAsJSON(): string {
  const report = generateAnalyticsReport();
  return JSON.stringify(report, null, 2);
}

export function downloadAnalyticsReport(): void {
  try {
    const reportJson = exportAnalyticsAsJSON();
    const blob = new Blob([reportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `bc-ai-ecosystem-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics report downloaded successfully'); 
  }
  } catch (error) {
    console.error('Error downloading analytics report:', error);
  }
}

export function getSearchAnalytics(): any[] {
  try {
    const stored = localStorage.getItem('search_analytics');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Could not retrieve search analytics:', error);
    return [];
  }
}

export function getCriticalErrors(): any[] {
  try {
    const stored = localStorage.getItem('critical_errors');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Could not retrieve critical errors:', error);
    return [];
  }
}

export function clearAnalyticsData(): void {
  try {
    localStorage.removeItem('search_analytics');
    localStorage.removeItem('critical_errors');
    if (process.env.NODE_ENV === 'development') {
    console.log('📊 Analytics data cleared');
  }
  } catch (error) {
    console.warn('Could not clear analytics data:', error);
  }
}

export function getAnalyticsSummary() {
  const searchAnalytics = getSearchAnalytics();
  const criticalErrors = getCriticalErrors();
  const sessionSummary = userAnalytics.getSessionSummary();
  const performanceSummary = performanceMonitor.getPerformanceSummary();

  return {
    totalSearches: searchAnalytics.length,
    averageSearchTime: performanceSummary.search_duration?.average || 0,
    totalErrors: criticalErrors.length,
    sessionDuration: sessionSummary.sessionDuration,
    pageViews: sessionSummary.pageViews,
    lastActivity: new Date().toISOString()
  };
}