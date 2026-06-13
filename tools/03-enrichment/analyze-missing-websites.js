#!/usr/bin/env node
/**
 * Analyze organizations missing websites by category
 */
const { Client } = require('@notionhq/client');
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

async function analyzeOrganizations() {
  console.log('🔍 Analyzing organizations without websites...\n');
  
  const organizations = [];
  let hasMore = true;
  let startCursor = undefined;
  
  while (hasMore) {
    const response = await notion.databases.query({
      database_id: dbId,
      filter: {
        property: 'Website',
        url: {
          is_empty: true
        }
      },
      page_size: 100,
      start_cursor: startCursor
    });
    
    organizations.push(...response.results);
    hasMore = response.has_more;
    startCursor = response.next_cursor;
  }
  
  console.log(`Found ${organizations.length} organizations without websites\n`);
  
  // Group by category
  const byCategory = {};
  const noCategory = [];
  
  for (const org of organizations) {
    const name = org.properties.Name.title[0]?.plain_text || 'Unknown';
    const category = org.properties.Category?.select?.name;
    
    if (category) {
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(name);
    } else {
      noCategory.push(name);
    }
  }
  
  // Display results
  console.log('Organizations by Category:\n');
  
  const sortedCategories = Object.keys(byCategory).sort((a, b) => 
    byCategory[b].length - byCategory[a].length
  );
  
  for (const category of sortedCategories) {
    console.log(`${category}: ${byCategory[category].length} organizations`);
    // Show first 5 examples
    const examples = byCategory[category].slice(0, 5);
    examples.forEach(name => console.log(`  - ${name}`));
    if (byCategory[category].length > 5) {
      console.log(`  ... and ${byCategory[category].length - 5} more`);
    }
    console.log();
  }
  
  console.log(`\nNo Category: ${noCategory.length} organizations`);
  if (noCategory.length > 0) {
    const examples = noCategory.slice(0, 5);
    examples.forEach(name => console.log(`  - ${name}`));
    if (noCategory.length > 5) {
      console.log(`  ... and ${noCategory.length - 5} more`);
    }
  }
}

// Run the script
analyzeOrganizations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});