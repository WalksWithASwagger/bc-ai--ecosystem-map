#!/usr/bin/env node
/**
 * Check for potential duplicates in the Notion database (active pages only)
 * Usage: NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/check-active-duplicates.js
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const stringSimilarity = require('string-similarity');
require('dotenv').config();

if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
  console.error('Set NOTION_TOKEN and NOTION_DATABASE_ID env vars');
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;
const SIMILARITY_THRESHOLD = 0.9; // Names with similarity score above this are considered potential duplicates

async function checkDuplicates() {
  console.log('🔍 Fetching organization names...');
  
  // Query database for all pages
  const pages = [];
  let cursor;
  
  do {
    const response = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      filter: {
        property: 'Name',
        title: { is_not_empty: true }
      }
    });
    
    // Only include non-archived pages
    const activePagesOnly = response.results.filter(page => !page.archived);
    pages.push(...activePagesOnly);
    
    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor);
  
  // Extract organization names
  const orgs = pages.map(page => {
    const name = page.properties.Name.title[0]?.plain_text || 'Unnamed';
    return { id: page.id, name };
  });
  
  console.log(`Total active orgs: ${orgs.length}`);
  
  // Find potential duplicates
  const potentialDuplicates = [];
  
  for (let i = 0; i < orgs.length; i++) {
    for (let j = i + 1; j < orgs.length; j++) {
      const org1 = orgs[i];
      const org2 = orgs[j];
      
      // Calculate name similarity
      const similarity = stringSimilarity.compareTwoStrings(org1.name, org2.name);
      
      if (similarity >= SIMILARITY_THRESHOLD) {
        potentialDuplicates.push({
          org1,
          org2,
          similarity
        });
      }
    }
  }
  
  // Sort by similarity (highest first)
  potentialDuplicates.sort((a, b) => b.similarity - a.similarity);
  
  // Output results
  if (potentialDuplicates.length > 0) {
    console.log(`⚠️ Possible duplicates (${potentialDuplicates.length}):`);
    potentialDuplicates.forEach(dup => {
      console.log(`- ${dup.org1.name} ↔ ${dup.org2.name} (${dup.similarity})`);
    });
    
    // Write report to file
    const timestamp = new Date().toISOString().split('T')[0];
    const reportPath = path.join('reports', `${timestamp}_active-duplicate-check.md`);
    
    let report = `# Active Duplicates Check Report\n\n`;
    report += `*Generated on ${new Date().toLocaleString()}*\n\n`;
    report += `## Potential Duplicates\n\n`;
    report += `| Organization 1 | Organization 2 | Similarity |\n`;
    report += `|---------------|---------------|------------|\n`;
    
    potentialDuplicates.forEach(dup => {
      report += `| [${dup.org1.name}](https://www.notion.so/${dup.org1.id.replace(/-/g, '')}) | [${dup.org2.name}](https://www.notion.so/${dup.org2.id.replace(/-/g, '')}) | ${dup.similarity.toFixed(4)} |\n`;
    });
    
    // Ensure reports directory exists
    if (!fs.existsSync('reports')) {
      fs.mkdirSync('reports');
    }
    
    fs.writeFileSync(reportPath, report);
    console.log(`📝 Report written to: ${reportPath}`);
  } else {
    console.log('✅ No potential duplicates found');
  }
}

checkDuplicates().catch(error => {
  console.error('Error:', error.message);
  if (error.body) console.error('API Error:', error.body);
  process.exit(1);
}); 