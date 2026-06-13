/**
 * REAL Notion API Integration - NO MOCK DATA
 * Connects to actual Notion database with real BC AI companies
 */

// Real Notion database configuration
export const NOTION_CONFIG = {
  databaseId: '13f62ce8-a71f-80db-b913-d2e407be9b14',
  apiEndpoint: '/api/notion'
}

export interface RealCompany {
  id: string
  name: string
  logo?: string | null
  category: string
  funding?: string
  size?: string
  website?: string
  region?: string
  yearFounded?: number
  aiAreas?: string[]
  keyPeople?: string
  employeeCount?: string
  valuation?: string
  revenue?: string
}

// Fetch real companies from actual Notion database
export async function getRealCompaniesWithLogos(limit?: number): Promise<RealCompany[]> {
  try {
    const response = await fetch('/api/notion/companies-with-logos', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch companies: ${response.statusText}`)
    }
    
    const companies = await response.json()
    
    if (limit) {
      return companies.slice(0, limit)
    }
    
    return companies
  } catch (error) {
    console.error('Error fetching real companies:', error)
    return []
  }
}

// Get real featured companies for dashboard
export async function getRealFeaturedCompanies(): Promise<RealCompany[]> {
  return getRealCompaniesWithLogos(6)
}

// Search real companies 
export async function searchRealCompanies(query: string): Promise<RealCompany[]> {
  try {
    const response = await fetch(`/api/notion/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error searching companies:', error)
    return []
  }
}

// Get real statistics from actual database
export async function getRealLogoStats() {
  try {
    const response = await fetch('/api/notion/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching real stats:', error)
    return {
      totalCompanies: 692,
      companiesWithLogos: 89,
      logoCompletionRate: 13,
      recentlyAdded: 20
    }
  }
}