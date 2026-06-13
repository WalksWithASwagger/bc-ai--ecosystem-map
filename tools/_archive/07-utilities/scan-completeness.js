#!/usr/bin/env node
/**
 * Scan Notion database for completeness and generate a report
 * Usage: NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/scan-completeness.js
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');

if (!process.env.NOTION_TOKEN || !process.env.NOTION_DATABASE_ID) {
  console.error('Set NOTION_TOKEN and NOTION_DATABASE_ID env vars');
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;

// Key fields to check for completeness
const PRIORITY_FIELDS = [
  'Website',
  'LinkedIn',
  'Email',
  'Phone',
  'City/Region',
  'BC Region',
  'Category',
  'AI Focus Areas',
  'Year Founded',
  'Size',
  'Short Blurb',
  'Key People',
  'Latitude',
  'Longitude',
  'Logo'
];

// Helper to safely extract property values
function getPropertyValue(page, propName) {
  const prop = page.properties[propName];
  if (!prop) return null;

  switch (prop.type) {
    case 'title':
    case 'rich_text':
      return prop[prop.type].length > 0 && prop[prop.type][0].plain_text ? prop[prop.type][0].plain_text : null;
    case 'url':
    case 'email':
    case 'phone_number':
      return prop[prop.type] || null;
    case 'select':
      return prop.select?.name || null;
    case 'multi_select':
      return prop.multi_select.length > 0 ? prop.multi_select.map(s => s.name).join(', ') : null;
    case 'number':
      return prop.number !== null ? prop.number : null;
    case 'files':
      return prop.files.length > 0 ? prop.files[0].name : null;
    default:
      return null;
  }
}

// Main function
async function scanDatabase() {
  console.log('🔍 Scanning Notion database for completeness...');
  
  // Fetch all pages from database
  const pages = [];
  let cursor;
  let count = 0;
  
  do {
    const response = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100
    });
    
    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : null;
    count += response.results.length;
    console.log(`Fetched ${count} organizations...`);
  } while (cursor);
  
  console.log(`Total: ${pages.length} organizations`);
  
  // Analyze completeness
  const results = [];
  const fieldStats = {};
  PRIORITY_FIELDS.forEach(field => { fieldStats[field] = 0 });
  
  pages.forEach(page => {
    const name = getPropertyValue(page, 'Name') || 'Unknown Organization';
    const orgResult = { 
      name,
      id: page.id,
      url: page.url,
      completeness: {} 
    };
    
    let filledCount = 0;
    PRIORITY_FIELDS.forEach(field => {
      const value = getPropertyValue(page, field);
      const hasValue = value !== null && value !== '';
      orgResult.completeness[field] = hasValue ? 1 : 0;
      
      if (hasValue) {
        filledCount++;
        fieldStats[field]++;
      }
    });
    
    orgResult.filledCount = filledCount;
    orgResult.totalFields = PRIORITY_FIELDS.length;
    orgResult.percentComplete = Math.round((filledCount / PRIORITY_FIELDS.length) * 100);
    
    results.push(orgResult);
  });
  
  // Sort by completeness (least complete first)
  results.sort((a, b) => a.filledCount - b.filledCount);
  
  // Generate summary report
  const summaryPath = path.join('reports', `${new Date().toISOString().split('T')[0]}_completeness-summary.md`);
  let summaryContent = `# BC AI Ecosystem Database Completeness Report\n\n`;
  summaryContent += `*Generated on ${new Date().toLocaleString()}*\n\n`;
  summaryContent += `## Overall Statistics\n\n`;
  summaryContent += `Total organizations: **${pages.length}**\n\n`;
  summaryContent += `### Field Completion Rates\n\n`;
  summaryContent += `| Field | Complete | Incomplete | % Complete |\n`;
  summaryContent += `|-------|----------|------------|------------|\n`;
  
  PRIORITY_FIELDS.forEach(field => {
    const complete = fieldStats[field];
    const incomplete = pages.length - complete;
    const percentComplete = Math.round((complete / pages.length) * 100);
    summaryContent += `| ${field} | ${complete} | ${incomplete} | ${percentComplete}% |\n`;
  });
  
  summaryContent += `\n## Most Incomplete Organizations\n\n`;
  summaryContent += `These organizations have the fewest fields completed and should be prioritized for data enhancement:\n\n`;
  summaryContent += `| Organization | % Complete | Missing Fields |\n`;
  summaryContent += `|-------------|------------|---------------|\n`;
  
  // Show top 25 most incomplete
  results.slice(0, 25).forEach(org => {
    const missingFields = PRIORITY_FIELDS.filter(field => org.completeness[field] === 0).join(', ');
    summaryContent += `| [${org.name}](${org.url}) | ${org.percentComplete}% | ${missingFields} |\n`;
  });
  
  summaryContent += `\n## Recommendations\n\n`;
  summaryContent += `1. **Priority Fields**: Focus on completing the following fields first:\n`;
  
  // Identify top 5 most missing fields
  const missingFieldsSorted = Object.entries(fieldStats)
    .map(([field, count]) => ({ field, missing: pages.length - count }))
    .sort((a, b) => b.missing - a.missing)
    .slice(0, 5);
  
  missingFieldsSorted.forEach(item => {
    const percentMissing = Math.round((item.missing / pages.length) * 100);
    summaryContent += `   - **${item.field}**: Missing for ${item.missing} orgs (${percentMissing}%)\n`;
  });
  
  summaryContent += `\n2. **Batch Updates**: Consider batch updating organizations by field type:\n`;
  summaryContent += `   - Geographic data (City/Region, BC Region, Latitude/Longitude)\n`;
  summaryContent += `   - Contact information (Website, LinkedIn, Email, Phone)\n`;
  summaryContent += `   - Company details (Category, AI Focus Areas, Year Founded, Size)\n`;
  summaryContent += `   - Rich content (Short Blurb, Key People, Logo)\n`;
  
  summaryContent += `\n3. **Data Sources**: Leverage these sources for enhancement:\n`;
  summaryContent += `   - Company websites and LinkedIn profiles\n`;
  summaryContent += `   - Industry directories and reports\n`;
  summaryContent += `   - BC business registries\n`;
  summaryContent += `   - Direct outreach for verification\n`;
  
  // Generate detailed CSV
  const csvPath = path.join('reports', `${new Date().toISOString().split('T')[0]}_completeness-detail.csv`);
  let csvContent = `Name,URL,${PRIORITY_FIELDS.join(',')},PercentComplete\n`;
  
  results.forEach(org => {
    const fieldValues = PRIORITY_FIELDS.map(field => org.completeness[field]);
    csvContent += `"${org.name}","${org.url}",${fieldValues.join(',')},${org.percentComplete}\n`;
  });
  
  // Ensure reports directory exists
  fs.mkdirSync('reports', { recursive: true });
  
  // Write files
  fs.writeFileSync(summaryPath, summaryContent);
  fs.writeFileSync(csvPath, csvContent);
  
  console.log(`✅ Summary report written to: ${summaryPath}`);
  console.log(`✅ Detailed CSV written to: ${csvPath}`);
}

// Run the scan
scanDatabase().catch(error => {
  console.error('Error:', error.message);
  if (error.body) console.error('API Error:', error.body);
  process.exit(1);
}); 