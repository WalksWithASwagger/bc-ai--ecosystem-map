#!/usr/bin/env node
/**
 * Fix invalid URLs in the Notion database by adding https:// prefix
 * Usage: NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/fix-invalid-urls.js
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

// Helper to safely extract property values
function getPropertyValue(page, propName) {
  const prop = page.properties[propName];
  if (!prop) return null;

  switch (prop.type) {
    case 'url':
      return prop.url || null;
    default:
      return null;
  }
}

async function fixInvalidUrls() {
  console.log('🔍 Fetching organizations with URLs from Notion...');
  
  // Fetch all pages from the database
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
    console.log(`Fetched ${pages.length} organizations so far...`);
  } while (cursor);
  
  console.log(`Total: ${pages.length} organizations`);
  
  // Find invalid URLs
  const invalidUrls = [];
  pages.forEach(page => {
    const name = page.properties.Name.title[0]?.plain_text || 'Unnamed';
    const website = getPropertyValue(page, 'Website');
    
    if (website && !website.match(/^https?:\/\//)) {
      invalidUrls.push({ 
        id: page.id, 
        name, 
        website
      });
    }
  });
  
  console.log(`Found ${invalidUrls.length} organizations with invalid URLs`);
  
  // Fix invalid URLs
  const fixed = [];
  const failed = [];
  
  for (const org of invalidUrls) {
    try {
      // Skip URLs that shouldn't be fixed
      if (org.website.includes('Active -') || 
          org.website.includes('Government program') ||
          org.website.includes('emerging from stealth')) {
        console.log(`Skipping special case: ${org.name}`);
        continue;
      }
      
      // Add https:// prefix
      const fixedUrl = `https://${org.website}`;
      
      // Update the page
      await notion.pages.update({
        page_id: org.id,
        properties: {
          Website: { url: fixedUrl }
        }
      });
      
      console.log(`✅ Fixed URL for ${org.name}: ${org.website} -> ${fixedUrl}`);
      fixed.push({ name: org.name, oldUrl: org.website, newUrl: fixedUrl });
    } catch (error) {
      console.error(`❌ Failed to fix URL for ${org.name}:`, error.message);
      failed.push({ name: org.name, url: org.website, error: error.message });
    }
  }
  
  // Create report
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join('reports', `${timestamp}_url-fixes.md`);
  let reportContent = `# URL Fixes Report\n\n`;
  reportContent += `*Generated on ${new Date().toLocaleString()}*\n\n`;
  
  reportContent += `## Summary\n\n`;
  reportContent += `- **Total Organizations**: ${pages.length}\n`;
  reportContent += `- **Invalid URLs Found**: ${invalidUrls.length}\n`;
  reportContent += `- **URLs Fixed**: ${fixed.length}\n`;
  reportContent += `- **Failed Fixes**: ${failed.length}\n\n`;
  
  reportContent += `## Fixed URLs\n\n`;
  reportContent += `| Organization | Old URL | New URL |\n`;
  reportContent += `|--------------|---------|--------|\n`;
  
  fixed.forEach(org => {
    reportContent += `| ${org.name} | ${org.oldUrl} | ${org.newUrl} |\n`;
  });
  
  if (failed.length > 0) {
    reportContent += `\n## Failed Fixes\n\n`;
    reportContent += `| Organization | URL | Error |\n`;
    reportContent += `|--------------|-----|-------|\n`;
    
    failed.forEach(org => {
      reportContent += `| ${org.name} | ${org.url} | ${org.error} |\n`;
    });
  }
  
  // Ensure reports directory exists
  if (!fs.existsSync('reports')) {
    fs.mkdirSync('reports');
  }
  
  // Write the report
  fs.writeFileSync(reportPath, reportContent);
  
  console.log(`\n📊 Results:`);
  console.log(`   ✅ URLs fixed: ${fixed.length}`);
  console.log(`   ❌ Failed: ${failed.length}`);
  console.log(`   📝 Report written to: ${reportPath}`);
}

// Run the script
fixInvalidUrls().catch(error => {
  console.error('Error:', error.message);
  if (error.body) console.error('API Error:', error.body);
  process.exit(1);
}); 