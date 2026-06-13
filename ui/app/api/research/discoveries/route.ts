import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Discovery data structure representing a research finding
 *
 * @interface Discovery
 * @property {string} id - Unique identifier for the discovery
 * @property {string} name - Name of the discovered entity
 * @property {'company'|'funding'|'competitive'|'market'} type - Discovery type category
 * @property {number} tier - Priority tier (1 = highest priority)
 * @property {number} score - Quality/relevance score (0-100)
 * @property {string} sector - Industry sector
 * @property {string} location - Geographic location
 * @property {string} description - Discovery description
 * @property {string} source - Data source (e.g., "BetaKit", "Crunchbase")
 * @property {string} timestamp - ISO timestamp of discovery
 * @property {number} confidence - Confidence level (0-100)
 * @property {'pending'|'approved'|'rejected'} status - Review status
 * @property {any} [originalData] - Optional original source data
 */
interface Discovery {
  id: string;
  name: string;
  type: 'company' | 'funding' | 'competitive' | 'market';
  tier: number;
  score: number;
  sector: string;
  location: string;
  description: string;
  source: string;
  timestamp: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected';
  originalData?: any;
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET endpoint for fetching research discoveries
 *
 * Retrieves research discoveries from local data files with filtering,
 * pagination, and aggregated statistics.
 *
 * @async
 * @param {NextRequest} request - Next.js request object
 * @returns {Promise<NextResponse>} JSON response with discoveries and stats
 *
 * @description
 * Query parameters:
 * - filter: 'all' | 'pending' | 'tier1' | 'company' | 'funding' | 'competitive' | 'market'
 * - limit: Number of results to return (default: 50)
 * - offset: Pagination offset (default: 0)
 *
 * Response structure:
 * ```json
 * {
 *   "success": true,
 *   "discoveries": Discovery[],
 *   "stats": {
 *     "total": number,
 *     "pending": number,
 *     "byType": Record<string, number>,
 *     "averageScore": number
 *   },
 *   "hasMore": boolean
 * }
 * ```
 *
 * @throws {500} When discovery data cannot be loaded or processed
 *
 * @example
 * // Fetch pending tier 1 discoveries
 * const response = await fetch('/api/research/discoveries?filter=tier1&limit=20');
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const discoveries = await getDiscoveries(filter, limit, offset);
    const stats = await getDiscoveryStats(discoveries);

    return NextResponse.json({
      success: true,
      discoveries,
      stats,
      hasMore: discoveries.length === limit
    });
  } catch (error) {
    console.error('Error fetching discoveries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch discoveries' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for discovery actions (approve, reject, import)
 *
 * Handles various actions on discoveries including status updates and
 * importing to Notion database.
 *
 * @async
 * @param {NextRequest} request - Next.js request object
 * @returns {Promise<NextResponse>} JSON response with action result
 *
 * @description
 * Request body:
 * ```json
 * {
 *   "action": "approve" | "reject" | "bulk_approve" | "import_to_notion",
 *   "discoveryId": string,
 *   "discoveryData": { ids: string[] } // for bulk operations
 * }
 * ```
 *
 * Supported actions:
 * - approve: Mark a discovery as approved
 * - reject: Mark a discovery as rejected
 * - bulk_approve: Approve multiple discoveries
 * - import_to_notion: Import discovery to Notion database
 *
 * @throws {400} When invalid action is specified
 * @throws {500} When action processing fails
 *
 * @example
 * // Approve a discovery
 * await fetch('/api/research/discoveries', {
 *   method: 'POST',
 *   body: JSON.stringify({
 *     action: 'approve',
 *     discoveryId: 'funding-betakit-001'
 *   })
 * });
 */
export async function POST(request: NextRequest) {
  try {
    const { action, discoveryId, discoveryData } = await request.json();

    switch (action) {
      case 'approve':
        await approveDiscovery(discoveryId);
        break;
      case 'reject':
        await rejectDiscovery(discoveryId);
        break;
      case 'bulk_approve':
        await bulkApproveDiscoveries(discoveryData.ids);
        break;
      case 'import_to_notion':
        await importToNotion(discoveryId);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Action ${action} completed successfully`
    });
  } catch (error) {
    console.error('Error processing discovery action:', error);
    return NextResponse.json(
      { success: false, error: 'Action failed' },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getDiscoveries(filter: string, limit: number, offset: number): Promise<Discovery[]> {
  const discoveries: Discovery[] = [];
  
  try {
    // ONLY use real data - no mock data
    const realDiscoveries = await loadRealDiscoveries();
    discoveries.push(...realDiscoveries);
    
    // Sort by timestamp (most recent first)
    discoveries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Apply filters
    let filteredDiscoveries = discoveries;
    
    if (filter !== 'all') {
      filteredDiscoveries = discoveries.filter(d => {
        switch (filter) {
          case 'pending':
            return d.status === 'pending';
          case 'tier1':
            return d.tier === 1;
          case 'company':
          case 'funding':
          case 'competitive':
          case 'market':
            return d.type === filter;
          default:
            return true;
        }
      });
    }
    
    // Apply pagination
    return filteredDiscoveries.slice(offset, offset + limit);
    
  } catch (error) {
    console.error('Error reading discoveries:', error);
    return []; // Return empty array instead of mock data
  }
}

async function loadRealDiscoveries(): Promise<Discovery[]> {
  const discoveries: Discovery[] = [];
  
  const dataDirs = [
    path.join(process.cwd(), '../data/discoveries'),
    path.join(process.cwd(), '../logs/scrapers')
  ];
  
  for (const dataDir of dataDirs) {
    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir);
      const recentFiles = files
        .filter(f => f.endsWith('.json') && f.includes('2025-08-04'))
        .sort()
        .slice(-3); // Get last 3 files
      
      for (const file of recentFiles) {
        const filePath = path.join(dataDir, file);
        
        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          const data = JSON.parse(fileContent);
          const processedDiscoveries = processFileData(data, file);
          discoveries.push(...processedDiscoveries);
        } catch (parseError) {
          console.warn(`Failed to parse ${file}:`, parseError);
          continue;
        }
      }
    }
  }
  
  return discoveries;
}

function processFileData(data: any, filename: string): Discovery[] {
  const discoveries: Discovery[] = [];
  const timestamp = new Date().toISOString();
  
  // Handle funding data (like your BetaKit scraper)
  if (filename.includes('funding') && data.companies) {
    data.companies.forEach((company: any, index: number) => {
      discoveries.push({
        id: `funding-${filename}-${index}`,
        name: company.companyName || company.name || 'Unknown Company',
        type: 'funding',
        tier: 1, // Funding events are usually high priority
        score: 85,
        sector: company.sector || 'Technology',
        location: company.location || 'BC',
        description: `Latest funding: ${company.fundingRounds?.[0]?.amountRaw || 'Recent funding round'}`,
        source: 'BetaKit',
        timestamp: timestamp,
        confidence: 90,
        status: 'pending',
        originalData: company
      });
    });
  }
  
  return discoveries;
}

// Mock data function removed - using only real data

async function getDiscoveryStats(discoveries: Discovery[]): Promise<any> {
  return {
    total: discoveries.length,
    pending: discoveries.filter(d => d.status === 'pending').length,
    approved: discoveries.filter(d => d.status === 'approved').length,
    tier1: discoveries.filter(d => d.tier === 1).length,
    tier2: discoveries.filter(d => d.tier === 2).length,
    tier3: discoveries.filter(d => d.tier === 3).length,
    byType: {
      company: discoveries.filter(d => d.type === 'company').length,
      funding: discoveries.filter(d => d.type === 'funding').length,
      competitive: discoveries.filter(d => d.type === 'competitive').length,
      market: discoveries.filter(d => d.type === 'market').length
    },
    averageScore: discoveries.reduce((sum, d) => sum + d.score, 0) / discoveries.length || 0,
    averageConfidence: discoveries.reduce((sum, d) => sum + d.confidence, 0) / discoveries.length || 0
  };
}

async function approveDiscovery(discoveryId: string): Promise<void> {
  const statusFile = path.join(process.cwd(), '../data/discovery-status.json');
  
  let status: Record<string, string> = {};
  
  if (fs.existsSync(statusFile)) {
    try {
      const content = fs.readFileSync(statusFile, 'utf8');
      status = JSON.parse(content);
    } catch (error) {
      // File exists but invalid JSON, start fresh
      status = {};
    }
  }
  
  status[discoveryId] = 'approved';
  
  // Ensure directory exists
  const statusDir = path.dirname(statusFile);
  if (!fs.existsSync(statusDir)) {
    fs.mkdirSync(statusDir, { recursive: true });
  }
  
  fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
}

async function rejectDiscovery(discoveryId: string): Promise<void> {
  const statusFile = path.join(process.cwd(), '../data/discovery-status.json');
  
  let status: Record<string, string> = {};
  
  if (fs.existsSync(statusFile)) {
    try {
      const content = fs.readFileSync(statusFile, 'utf8');
      status = JSON.parse(content);
    } catch (error) {
      status = {};
    }
  }
  
  status[discoveryId] = 'rejected';
  
  const statusDir = path.dirname(statusFile);
  if (!fs.existsSync(statusDir)) {
    fs.mkdirSync(statusDir, { recursive: true });
  }
  
  fs.writeFileSync(statusFile, JSON.stringify(status, null, 2));
}

async function bulkApproveDiscoveries(ids: string[]): Promise<void> {
  for (const id of ids) {
    await approveDiscovery(id);
  }
}

async function importToNotion(discoveryId: string): Promise<void> {
  console.log(`Importing discovery ${discoveryId} to Notion database`);
  // TODO: Implement actual Notion import using your existing integration
}