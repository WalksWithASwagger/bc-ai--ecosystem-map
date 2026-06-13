import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import type { Organization, Stats } from '../../../types';

/**
 * Notion API client instance
 * @constant
 */
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

/**
 * Flag to prevent concurrent database fetch operations
 * @type {boolean}
 */
let isCurrentlyFetching = false;

/**
 * Cached API response data to reduce database queries
 * @type {any}
 */
let cachedResponse: any = null;

/**
 * Timestamp of the last cache update
 * @type {number}
 */
let cacheTimestamp = 0;

/**
 * Cache duration in milliseconds (5 minutes)
 * @constant
 * @type {number}
 */
const CACHE_DURATION = 300000; // 5 minute cache (increased for better performance)

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract property value from Notion property object
 *
 * @param {any} prop - Notion property object
 * @param {string} type - Expected property type (e.g., 'title', 'rich_text', 'url')
 * @param {string} [field] - Optional nested field to extract from property
 * @returns {any|null} Property value or null if type doesn't match
 *
 * @example
 * const titleProp = getProperty(page.properties.Name, 'title', 'title');
 * const url = getProperty(page.properties.Website, 'url', 'url');
 */
const getProperty = (prop: any, type: string, field?: string) => {
  if (!prop || prop.type !== type) return null;
  return field ? prop[field] : prop;
};

/**
 * Extract plain text from Notion title property
 *
 * @param {any} prop - Notion title property object
 * @returns {string} Plain text content or empty string
 */
const getTitleText = (prop: any) => {
  const title = getProperty(prop, 'title', 'title');
  return title?.[0]?.plain_text || '';
};

/**
 * Extract plain text from Notion rich text property
 *
 * @param {any} prop - Notion rich text property object
 * @returns {string} Plain text content or empty string
 */
const getRichText = (prop: any) => {
  const richText = getProperty(prop, 'rich_text', 'rich_text');
  return richText?.[0]?.plain_text || '';
};

/**
 * Extract selected option name from Notion select property
 *
 * @param {any} prop - Notion select property object
 * @returns {string} Selected option name or empty string
 */
const getSelectName = (prop: any) => {
  const select = getProperty(prop, 'select', 'select');
  return select?.name || '';
};

/**
 * Extract array of selected option names from Notion multi-select property
 *
 * @param {any} prop - Notion multi-select property object
 * @returns {string[]} Array of selected option names
 */
const getMultiSelectNames = (prop: any) => {
  const multiSelect = getProperty(prop, 'multi_select', 'multi_select');
  return multiSelect?.map((s: any) => s.name) || [];
};

/**
 * Extract URL from Notion URL property
 *
 * @param {any} prop - Notion URL property object
 * @returns {string} URL value or empty string
 */
const getUrl = (prop: any) => {
  const url = getProperty(prop, 'url', 'url');
  return url || '';
};

/**
 * Extract email from Notion email property
 *
 * @param {any} prop - Notion email property object
 * @returns {string} Email value or empty string
 */
const getEmail = (prop: any) => {
  const email = getProperty(prop, 'email', 'email');
  return email || '';
};

/**
 * Extract phone number from Notion phone number property
 *
 * @param {any} prop - Notion phone number property object
 * @returns {string} Phone number or empty string
 */
const getPhoneNumber = (prop: any) => {
  const phone = getProperty(prop, 'phone_number', 'phone_number');
  return phone || '';
};

/**
 * Extract numeric value from Notion number property
 *
 * @param {any} prop - Notion number property object
 * @returns {number|null} Numeric value or null
 */
const getNumber = (prop: any) => {
  const number = getProperty(prop, 'number', 'number');
  return number;
};

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET endpoint for fetching all organizations from Notion database
 *
 * This endpoint retrieves all organizations from the configured Notion database
 * and returns them with aggregated statistics. It implements:
 * - Response caching (5 minute cache duration)
 * - Concurrent request prevention
 * - Paginated database queries
 * - Data transformation and aggregation
 *
 * @async
 * @returns {Promise<NextResponse>} JSON response with organizations and stats
 *
 * @description
 * Response structure:
 * ```json
 * {
 *   "organizations": Organization[],
 *   "total": number,
 *   "stats": {
 *     "byRegion": Record<string, number>,
 *     "byCategory": Record<string, number>,
 *     "withWebsite": number,
 *     "withLinkedIn": number,
 *     "withEmail": number
 *   }
 * }
 * ```
 *
 * @throws {429} When a fetch operation is already in progress
 * @throws {500} When database query or processing fails
 *
 * @example
 * // Client-side fetch
 * const response = await fetch('/api/organizations');
 * const { organizations, total, stats } = await response.json();
 */
export async function GET() {
  try {
    // Return cached response if available and fresh
    if (cachedResponse && Date.now() - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json(cachedResponse);
    }

    // Prevent concurrent requests
    if (isCurrentlyFetching) {
      return NextResponse.json({ error: 'Already fetching data, please wait...' }, { status: 429 });
    }

    isCurrentlyFetching = true;

    const organizations = [];
    let hasMore = true;
    let startCursor = undefined;

    // Paginate through all database records
    while (hasMore) {
      const response = await notion.databases.query({
        database_id: process.env.NOTION_DATABASE_ID!,
        start_cursor: startCursor || undefined,
        page_size: 100, // Optimized page size for better performance
        sorts: [
          {
            property: 'Name',
            direction: 'ascending',
          },
        ],
      });

      // Transform Notion pages to Organization objects
      for (const page of response.results) {
        if ('properties' in page) {
          const props = page.properties as any; // Type assertion for Notion API flexibility

          organizations.push({
            id: page.id,
            name: getTitleText(props.Name),
            website: getUrl(props.Website),
            linkedin: getUrl(props.LinkedIn),
            email: getEmail(props.Email),
            phone: getPhoneNumber(props.Phone),
            city: getRichText(props['City/Region']),
            bcRegion: getSelectName(props['BC Region']),
            category: getSelectName(props.Category),
            aiFocusAreas: getMultiSelectNames(props['AI Focus Areas']),
            yearFounded: getNumber(props['Year Founded']),
            size: getSelectName(props.Size),
            shortBlurb: getRichText(props['Short Blurb']),
            keyPeople: getRichText(props['Key People']),
            latitude: getNumber(props.Latitude),
            longitude: getNumber(props.Longitude),
          });
        }
      }

      hasMore = response.has_more;
      startCursor = response.next_cursor;

    }

    // Calculate aggregate statistics
    const stats: Stats = {
      byRegion: organizations.reduce((acc: Record<string, number>, org) => {
        const region = org.bcRegion || 'Unknown';
        acc[region] = (acc[region] || 0) + 1;
        return acc;
      }, {}),
      byCategory: organizations.reduce((acc: Record<string, number>, org) => {
        const category = org.category || 'Unknown';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {}),
      withWebsite: organizations.filter(org => org.website).length,
      withLinkedIn: organizations.filter(org => org.linkedin).length,
      withEmail: organizations.filter(org => org.email).length,
    };

    const responseData = {
      organizations,
      total: organizations.length,
      stats
    };

    // Cache the response
    cachedResponse = responseData;
    cacheTimestamp = Date.now();
    isCurrentlyFetching = false;

    return NextResponse.json(responseData);
  } catch (error: any) {
    isCurrentlyFetching = false; // Reset flag on error
    console.error('Error fetching organizations:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    return NextResponse.json({
      error: 'Failed to fetch organizations',
      message: error.message,
      code: error.code
    }, { status: 500 });
  }
}