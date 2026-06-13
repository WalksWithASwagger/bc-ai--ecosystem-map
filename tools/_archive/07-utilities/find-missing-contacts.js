#!/usr/bin/env node
/**
 * Find organizations with missing contact information
 * Usage: NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/find-missing-contacts.js
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

// Contact fields to check
const CONTACT_FIELDS = ['Website', 'Email', 'Phone', 'LinkedIn'];

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
    default:
      return null;
  }
}

async function findMissingContacts() {
  console.log('🔍 Scanning for missing contact information...');
  
  // Fetch all pages from database
  const pages = [];
  let cursor;
  
  do {
    const response = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100
    });
    
    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor);
  
  console.log(`Total: ${pages.length} organizations`);
  
  // Process organizations
  const orgsWithMissingContacts = pages.map(page => {
    const name = getPropertyValue(page, 'Name') || 'Unknown Organization';
    const contacts = {};
    let missingCount = 0;
    
    CONTACT_FIELDS.forEach(field => {
      const value = getPropertyValue(page, field);
      contacts[field] = value;
      if (!value) missingCount++;
    });
    
    // Get region and category for grouping
    const region = getPropertyValue(page, 'BC Region');
    const category = getPropertyValue(page, 'Category');
    
    return {
      name,
      url: page.url,
      contacts,
      missingCount,
      region,
      category
    };
  });
  
  // Sort by number of missing contact fields (most missing first)
  orgsWithMissingContacts.sort((a, b) => b.missingCount - a.missingCount);
  
  // Generate statistics
  const stats = {
    total: pages.length,
    byField: {}
  };
  
  CONTACT_FIELDS.forEach(field => {
    stats.byField[field] = {
      missing: orgsWithMissingContacts.filter(org => !org.contacts[field]).length,
      present: orgsWithMissingContacts.filter(org => org.contacts[field]).length
    };
  });
  
  // Generate markdown report
  const reportPath = path.join('reports', `${new Date().toISOString().split('T')[0]}_missing-contacts.md`);
  let reportContent = `# Missing Contact Information Report\n\n`;
  reportContent += `*Generated on ${new Date().toLocaleString()}*\n\n`;
  
  // Add statistics
  reportContent += `## Overall Statistics\n\n`;
  reportContent += `| Contact Field | Missing | Present | % Complete |\n`;
  reportContent += `|---------------|---------|---------|------------|\n`;
  
  CONTACT_FIELDS.forEach(field => {
    const missing = stats.byField[field].missing;
    const present = stats.byField[field].present;
    const percentComplete = Math.round((present / stats.total) * 100);
    reportContent += `| ${field} | ${missing} | ${present} | ${percentComplete}% |\n`;
  });
  
  // Organizations with all contact fields missing
  const completelyMissing = orgsWithMissingContacts.filter(org => org.missingCount === CONTACT_FIELDS.length);
  reportContent += `\n## Organizations with No Contact Information (${completelyMissing.length})\n\n`;
  
  if (completelyMissing.length > 0) {
    reportContent += `| Organization | BC Region | Category | Notion Page |\n`;
    reportContent += `|-------------|-----------|----------|------------|\n`;
    
    completelyMissing.forEach(org => {
      reportContent += `| ${org.name} | ${org.region || 'Unknown'} | ${org.category || 'Unknown'} | [Link](${org.url}) |\n`;
    });
  } else {
    reportContent += `*No organizations are missing all contact fields.*\n`;
  }
  
  // Organizations missing website (most critical)
  const missingWebsite = orgsWithMissingContacts.filter(org => !org.contacts.Website && org.missingCount < CONTACT_FIELDS.length);
  reportContent += `\n## Organizations Missing Website (${missingWebsite.length})\n\n`;
  
  if (missingWebsite.length > 0) {
    reportContent += `| Organization | Has Email | Has Phone | Has LinkedIn | Notion Page |\n`;
    reportContent += `|-------------|-----------|-----------|--------------|------------|\n`;
    
    missingWebsite.slice(0, 50).forEach(org => {
      reportContent += `| ${org.name} | ${org.contacts.Email ? '✅' : '❌'} | ${org.contacts.Phone ? '✅' : '❌'} | ${org.contacts.LinkedIn ? '✅' : '❌'} | [Link](${org.url}) |\n`;
    });
    
    if (missingWebsite.length > 50) {
      reportContent += `\n*...and ${missingWebsite.length - 50} more organizations*\n`;
    }
  }
  
  // Organizations by region with contact gaps
  reportContent += `\n## Contact Gaps by Region\n\n`;
  
  // Group by region
  const regionGroups = {};
  orgsWithMissingContacts.forEach(org => {
    const region = org.region || 'Unknown';
    if (!regionGroups[region]) {
      regionGroups[region] = [];
    }
    regionGroups[region].push(org);
  });
  
  Object.keys(regionGroups).sort().forEach(region => {
    const orgs = regionGroups[region];
    const missingAny = orgs.filter(org => org.missingCount > 0);
    
    reportContent += `### ${region} (${missingAny.length}/${orgs.length} orgs with missing contacts)\n\n`;
    reportContent += `| Missing | Count | % of Region |\n`;
    reportContent += `|---------|-------|-------------|\n`;
    
    CONTACT_FIELDS.forEach(field => {
      const missing = orgs.filter(org => !org.contacts[field]).length;
      const percentOfRegion = Math.round((missing / orgs.length) * 100);
      reportContent += `| ${field} | ${missing} | ${percentOfRegion}% |\n`;
    });
    
    reportContent += `\n`;
  });
  
  // Research recommendations
  reportContent += `## Research Recommendations\n\n`;
  reportContent += `1. **Prioritize Website Discovery**: Focus first on finding official websites for the ${stats.byField.Website.missing} organizations missing this field.\n\n`;
  reportContent += `2. **LinkedIn Connection**: For the ${stats.byField.LinkedIn.missing} organizations without LinkedIn profiles, search for company pages.\n\n`;
  reportContent += `3. **Regional Focus**: Target the regions with highest percentage of missing contact information.\n\n`;
  reportContent += `4. **Category Patterns**: Research similar organizations in the same category to find industry directories.\n\n`;
  reportContent += `5. **Batch Processing**: Create targeted lists of 10-20 organizations at a time for focused research sessions.\n`;
  
  // Ensure reports directory exists
  fs.mkdirSync('reports', { recursive: true });
  
  // Write file
  fs.writeFileSync(reportPath, reportContent);
  
  console.log(`✅ Missing contacts report written to: ${reportPath}`);
}

// Run the script
findMissingContacts().catch(error => {
  console.error('Error:', error.message);
  if (error.body) console.error('API Error:', error.body);
  process.exit(1);
}); 