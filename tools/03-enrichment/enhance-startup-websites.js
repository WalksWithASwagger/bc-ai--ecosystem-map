#!/usr/bin/env node
/**
 * Find websites for startups and scale-ups
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const axios = require('axios');
require('dotenv').config();

// Try to load configuration
let config = {};
try {
  config = require('./config');
} catch (e) {
  // Config file doesn't exist, will use environment variables
}

// Get Notion credentials
const notionToken = config.NOTION_TOKEN || process.env.NOTION_TOKEN;
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

if (!notionToken || !dbId) {
  console.error('Notion token and database ID are required.');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });

async function findStartupsNeedingWebsites() {
  console.log('🔍 Finding startups and scale-ups without websites...\n');
  
  const organizations = [];
  let hasMore = true;
  let startCursor = undefined;
  
  while (hasMore) {
    const response = await notion.databases.query({
      database_id: dbId,
      filter: {
        and: [
          {
            property: 'Website',
            url: {
              is_empty: true
            }
          },
          {
            property: 'Category',
            select: {
              equals: 'Start-ups & Scale-ups'
            }
          }
        ]
      },
      page_size: 100,
      start_cursor: startCursor
    });
    
    organizations.push(...response.results);
    hasMore = response.has_more;
    startCursor = response.next_cursor;
  }
  
  return organizations;
}

async function searchGoogle(query) {
  try {
    // Using Google Custom Search API would be ideal, but we'll use a simple approach
    // In production, you'd want to use the actual Google Custom Search API
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    // Since we can't directly scrape Google, we'll construct likely URLs
    // This is a simplified approach
    return null;
  } catch (error) {
    return null;
  }
}

async function constructLikelyUrls(companyName) {
  // Clean company name
  const cleanName = companyName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');
  
  // Common patterns for startup websites
  const patterns = [
    `https://www.${cleanName}.com`,
    `https://${cleanName}.com`,
    `https://www.${cleanName}.ca`,
    `https://${cleanName}.ca`,
    `https://www.${cleanName}.io`,
    `https://${cleanName}.io`,
    `https://www.${cleanName}.ai`,
    `https://${cleanName}.ai`,
    `https://www.${cleanName}.tech`,
    `https://www.${cleanName}.co`
  ];
  
  return patterns;
}

async function verifyUrl(url) {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      maxRedirects: 5,
      validateStatus: status => status < 400,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function processStartups() {
  const startups = await findStartupsNeedingWebsites();
  console.log(`Found ${startups.length} startups without websites\n`);
  
  const results = {
    processed: 0,
    websitesAdded: 0,
    skipped: 0,
    failed: 0,
    details: []
  };
  
  // Process first 30 startups
  const limit = Math.min(30, startups.length);
  
  for (let i = 0; i < limit; i++) {
    const startup = startups[i];
    const name = startup.properties.Name.title[0]?.plain_text || 'Unknown';
    
    console.log(`\nProcessing ${name}...`);
    results.processed++;
    
    // Generate likely URLs
    const possibleUrls = await constructLikelyUrls(name);
    let foundUrl = null;
    
    // Test each URL
    for (const url of possibleUrls) {
      console.log(`   Testing ${url}...`);
      const isValid = await verifyUrl(url);
      
      if (isValid) {
        foundUrl = url;
        console.log(`   ✅ Found valid website: ${url}`);
        break;
      }
      
      // Rate limiting between checks
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    if (foundUrl) {
      try {
        await notion.pages.update({
          page_id: startup.id,
          properties: {
            Website: { url: foundUrl }
          }
        });
        
        results.websitesAdded++;
        results.details.push({
          name,
          url: foundUrl,
          status: 'added'
        });
      } catch (error) {
        console.error(`   ❌ Failed to update: ${error.message}`);
        results.failed++;
      }
    } else {
      console.log(`   No valid website found`);
      results.skipped++;
      results.details.push({
        name,
        status: 'not_found'
      });
    }
    
    // Rate limiting between organizations
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Results:');
  console.log(`   ✅ Startups processed: ${results.processed}`);
  console.log(`   ✅ Websites added: ${results.websitesAdded}`);
  console.log(`   ⏭️ Startups skipped: ${results.skipped}`);
  console.log(`   ❌ Failed operations: ${results.failed}`);
  
  // Generate detailed report
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(__dirname, '..', 'reports', `${timestamp}_startup-website-enhancement.md`);
  
  let report = `# Startup Website Enhancement Report

*Generated on ${new Date().toLocaleString()}*

## Summary

- **Startups Processed**: ${results.processed}
- **Websites Added**: ${results.websitesAdded}
- **Startups Skipped**: ${results.skipped}
- **Failed Operations**: ${results.failed}

## Details

### Websites Found

`;

  const found = results.details.filter(d => d.status === 'added');
  if (found.length > 0) {
    found.forEach(item => {
      report += `- **${item.name}**: ${item.url}\n`;
    });
  } else {
    report += 'No websites found in this batch.\n';
  }

  report += '\n### Not Found\n\n';
  const notFound = results.details.filter(d => d.status === 'not_found');
  if (notFound.length > 0) {
    notFound.forEach(item => {
      report += `- ${item.name}\n`;
    });
  }

  report += `
## Notes

This enhancement focused on Start-ups & Scale-ups category. The script tested common domain patterns (.com, .ca, .io, .ai, .tech, .co) for each company name.
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Report written to: ${reportPath}`);
}

// Run the script
processStartups().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});