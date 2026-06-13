#!/usr/bin/env node
/**
 * Find and enhance websites for companies in categories likely to have websites
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

// Get Notion credentials
const notionToken = config.NOTION_TOKEN || process.env.NOTION_TOKEN;
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

if (!notionToken || !dbId) {
  console.error('Notion token and database ID are required.');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });

// Categories more likely to have websites
const targetCategories = [
  'AI Companies',
  'Research & Development',
  'Healthcare & Biotech',
  'Technology Companies',
  'Startups',
  'Service Providers',
  'Consulting & Professional Services',
  'Investors & Funding',
  'Education & Training'
];

async function findCompaniesNeedingWebsites() {
  console.log('🔍 Finding companies in target categories without websites...\n');
  
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
            or: targetCategories.map(category => ({
              property: 'Category',
              select: {
                equals: category
              }
            }))
          }
        ]
      },
      page_size: 100,
      start_cursor: startCursor
    });
    
    organizations.push(...response.results);
    hasMore = response.has_more;
    startCursor = response.next_cursor;
    
    console.log(`Fetched ${organizations.length} organizations so far...`);
  }
  
  return organizations;
}

async function searchForWebsite(orgName) {
  try {
    // Clean up the organization name for searching
    const searchQuery = orgName.replace(/\([^)]*\)/g, '').trim();
    
    // Try DuckDuckGo search API
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery + ' official website')}&format=json`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    // Extract first result URL if available
    if (response.data && response.data.Results && response.data.Results.length > 0) {
      const firstResult = response.data.Results[0];
      if (firstResult.FirstURL) {
        console.log(`   Found potential website: ${firstResult.FirstURL}`);
        return firstResult.FirstURL;
      }
    }
    
    // Also check RelatedTopics
    if (response.data && response.data.RelatedTopics && response.data.RelatedTopics.length > 0) {
      for (const topic of response.data.RelatedTopics) {
        if (topic.FirstURL && topic.FirstURL.includes('http')) {
          console.log(`   Found potential website: ${topic.FirstURL}`);
          return topic.FirstURL;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`   Error searching for ${orgName}: ${error.message}`);
    return null;
  }
}

async function verifyWebsite(url) {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      validateStatus: status => status < 400
    });
    return true;
  } catch (error) {
    return false;
  }
}

async function processOrganizations() {
  const organizations = await findCompaniesNeedingWebsites();
  console.log(`\nFound ${organizations.length} companies in target categories without websites\n`);
  
  const results = {
    processed: 0,
    websitesAdded: 0,
    skipped: 0,
    failed: 0
  };
  
  // Process first 30 organizations
  const limit = Math.min(30, organizations.length);
  
  for (let i = 0; i < limit; i++) {
    const org = organizations[i];
    const orgName = org.properties.Name.title[0]?.plain_text || 'Unknown';
    const category = org.properties.Category?.select?.name || 'Unknown';
    
    console.log(`\nProcessing ${orgName} (${category})...`);
    results.processed++;
    
    const website = await searchForWebsite(orgName);
    
    if (website) {
      // Verify the website is accessible
      const isValid = await verifyWebsite(website);
      
      if (isValid) {
        try {
          await notion.pages.update({
            page_id: org.id,
            properties: {
              Website: { url: website }
            }
          });
          
          console.log(`   ✅ Added website: ${website}`);
          results.websitesAdded++;
        } catch (error) {
          console.error(`   ❌ Failed to update: ${error.message}`);
          results.failed++;
        }
      } else {
        console.log(`   ⚠️  Website not accessible: ${website}`);
        results.skipped++;
      }
    } else {
      console.log(`   No website found`);
      results.skipped++;
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Results:');
  console.log(`   ✅ Organizations processed: ${results.processed}`);
  console.log(`   ✅ Websites added: ${results.websitesAdded}`);
  console.log(`   ⏭️ Organizations skipped: ${results.skipped}`);
  console.log(`   ❌ Failed operations: ${results.failed}`);
  
  // Generate report
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(__dirname, '..', 'reports', `${timestamp}_targeted-website-enhancement.md`);
  
  let report = `# Targeted Website Enhancement Report

*Generated on ${new Date().toLocaleString()}*

## Summary

- **Organizations Processed**: ${results.processed}
- **Websites Added**: ${results.websitesAdded}
- **Organizations Skipped**: ${results.skipped}
- **Failed Operations**: ${results.failed}

## Target Categories

${targetCategories.map(cat => `- ${cat}`).join('\n')}

## Results

Successfully added ${results.websitesAdded} websites to organizations in categories more likely to have web presence.
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Report written to: ${reportPath}`);
}

// Run the script
processOrganizations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});