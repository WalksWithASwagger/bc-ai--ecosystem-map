#!/usr/bin/env node
/**
 * Find and verify websites for organizations with missing website information
 * Usage: node scripts/enhance-websites.js [--limit=50] [--batch=1]
 * 
 * Options:
 *   --limit=N    Process only N organizations (default: all)
 *   --batch=N    Process batch N (1-based, default: 1)
 *   --dryrun     Don't update Notion, just show what would be updated
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

// Try to load configuration
let config = {};
try {
  config = require('./config');
} catch (e) {
  // Config file doesn't exist, will use environment variables
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  limit: Infinity,
  batch: 1,
  dryrun: false
};

args.forEach(arg => {
  if (arg.startsWith('--limit=')) {
    options.limit = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--batch=')) {
    options.batch = parseInt(arg.split('=')[1], 10);
  } else if (arg === '--dryrun') {
    options.dryrun = true;
  }
});

// Get Notion token and database ID from config or environment variables
const notionToken = config.NOTION_TOKEN || process.env.NOTION_TOKEN;
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

// Check for required credentials
if (!notionToken || !dbId) {
  console.error('Notion token and database ID are required. Set them in config.js or as environment variables.');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });

// Helper function to safely extract property values
function getPropertyValue(page, propName) {
  const prop = page.properties[propName];
  if (!prop) return null;

  switch (prop.type) {
    case 'title':
      return prop.title.length > 0 ? prop.title[0].plain_text : null;
    case 'rich_text':
      return prop.rich_text.length > 0 ? prop.rich_text[0].plain_text : null;
    case 'url':
      return prop.url || null;
    default:
      return null;
  }
}

// Function to search for an organization's website
async function searchForWebsite(orgName) {
  try {
    // For demonstration purposes, we're using a simple approach
    // In a production environment, you would use a proper search API
    const searchQuery = encodeURIComponent(`${orgName} official website`);
    const response = await axios.get(`https://api.duckduckgo.com/?q=${searchQuery}&format=json`);
    
    if (response.data && response.data.Results && response.data.Results.length > 0) {
      // Return the first result
      return response.data.Results[0].FirstURL;
    }
    
    // No fallback - return null if no real website found
    return null;
  } catch (error) {
    console.error(`Error searching for ${orgName}:`, error.message);
    return null;
  }
}

// REMOVED: simulateSearchResult function
// We only add real, verified websites from actual search results
// No simulation or guessing allowed

// Function to verify a website by checking if it contains the organization name
async function verifyWebsite(url, orgName) {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const pageText = $('body').text().toLowerCase();
    const orgNameLower = orgName.toLowerCase();
    
    // Check if the page contains the organization name
    if (pageText.includes(orgNameLower)) {
      return {
        verified: true,
        confidence: 'high',
        url
      };
    }
    
    // Check if the domain contains parts of the organization name
    const domain = new URL(url).hostname;
    const domainParts = domain.split('.');
    const orgNameParts = orgNameLower.split(/\s+/);
    
    const matchingParts = orgNameParts.filter(part => 
      domainParts.some(domainPart => domainPart.includes(part) || part.includes(domainPart))
    );
    
    if (matchingParts.length > 0) {
      return {
        verified: true,
        confidence: 'medium',
        url
      };
    }
    
    return {
      verified: false,
      confidence: 'low',
      url
    };
  } catch (error) {
    console.error(`Error verifying ${url}:`, error.message);
    return {
      verified: false,
      confidence: 'error',
      url,
      error: error.message
    };
  }
}

// Main function to enhance websites
async function enhanceWebsites() {
  console.log('🔍 Finding organizations with missing websites...');
  
  // Query database for organizations with missing websites
  const pages = [];
  let cursor;
  let count = 0;
  
  do {
    const response = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      filter: {
        property: 'Website',
        url: { is_empty: true }
      }
    });
    
    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : null;
    count += response.results.length;
    console.log(`Fetched ${count} organizations so far...`);
  } while (cursor);
  
  console.log(`Found ${pages.length} organizations with missing websites`);
  
  // Calculate batch start and end
  const batchSize = options.limit === Infinity ? pages.length : options.limit;
  const startIndex = (options.batch - 1) * batchSize;
  const endIndex = Math.min(startIndex + batchSize, pages.length);
  
  if (startIndex >= pages.length) {
    console.error(`Batch ${options.batch} starts at index ${startIndex}, but there are only ${pages.length} organizations`);
    process.exit(1);
  }
  
  console.log(`Processing batch ${options.batch}: organizations ${startIndex + 1} to ${endIndex} (${endIndex - startIndex} total)`);
  
  const pagesToProcess = pages.slice(startIndex, endIndex);
  const results = {
    processed: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    websites: []
  };
  
  // Process each organization
  for (const page of pagesToProcess) {
    const orgName = getPropertyValue(page, 'Name');
    console.log(`Processing ${orgName}...`);
    results.processed++;
    
    try {
      // Search for the website
      const websiteUrl = await searchForWebsite(orgName);
      
      if (!websiteUrl) {
        console.log(`No website found for ${orgName}`);
        results.skipped++;
        continue;
      }
      
      // Verify the website
      const verification = await verifyWebsite(websiteUrl, orgName);
      
      if (verification.verified) {
        console.log(`✅ Found website for ${orgName}: ${verification.url} (confidence: ${verification.confidence})`);
        
        // Update the database if not in dry run mode
        if (!options.dryrun) {
          await notion.pages.update({
            page_id: page.id,
            properties: {
              Website: { url: verification.url }
            }
          });
        } else {
          console.log(`[DRY RUN] Would update ${orgName} with website: ${verification.url}`);
        }
        
        results.updated++;
        results.websites.push({
          name: orgName,
          url: verification.url,
          confidence: verification.confidence,
          pageId: page.id
        });
      } else {
        console.log(`❌ Could not verify website for ${orgName}: ${verification.url}`);
        results.skipped++;
      }
    } catch (error) {
      console.error(`Error processing ${orgName}:`, error.message);
      results.failed++;
    }
  }
  
  // Generate report
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join('..', 'reports', `${timestamp}_website-enhancement.md`);
  
  let report = `# Website Enhancement Report\n\n`;
  report += `*Generated on ${new Date().toLocaleString()}*\n\n`;
  report += `## Summary\n\n`;
  report += `- **Batch**: ${options.batch}\n`;
  report += `- **Organizations Processed**: ${results.processed}\n`;
  report += `- **Websites Added**: ${results.updated}\n`;
  report += `- **Organizations Skipped**: ${results.skipped}\n`;
  report += `- **Failed Operations**: ${results.failed}\n\n`;
  
  if (results.websites.length > 0) {
    report += `## Added Websites\n\n`;
    report += `| Organization | Website | Confidence |\n`;
    report += `|-------------|---------|------------|\n`;
    
    for (const website of results.websites) {
      report += `| [${website.name}](https://www.notion.so/${website.pageId.replace(/-/g, '')}) | ${website.url} | ${website.confidence} |\n`;
    }
  }
  
  // Ensure reports directory exists
  const reportsDir = path.join('..', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }
  
  fs.writeFileSync(reportPath, report);
  
  console.log(`\n📊 Results:`);
  console.log(`   ✅ Organizations processed: ${results.processed}`);
  console.log(`   ✅ Websites added: ${results.updated}`);
  console.log(`   ⏭️ Organizations skipped: ${results.skipped}`);
  console.log(`   ❌ Failed operations: ${results.failed}`);
  console.log(`   📝 Report written to: ${reportPath}`);
}

// Run the script
enhanceWebsites().catch(error => {
  console.error('Error:', error.message);
  if (error.body) console.error('API Error:', error.body);
  process.exit(1);
}); 