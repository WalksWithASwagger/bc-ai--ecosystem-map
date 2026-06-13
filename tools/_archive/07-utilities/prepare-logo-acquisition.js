#!/usr/bin/env node
/**
 * Prepare logo acquisition list
 * Usage: NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/prepare-logo-acquisition.js
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
    case 'title':
    case 'rich_text':
      return prop[prop.type].length > 0 && prop[prop.type][0].plain_text ? prop[prop.type][0].plain_text : null;
    case 'url':
      return prop.url || null;
    case 'select':
      return prop.select?.name || null;
    case 'files':
      return prop.files.length > 0 ? prop.files[0].name : null;
    default:
      return null;
  }
}

// Calculate completeness score for prioritization
function calculateCompleteness(page) {
  const fields = ['Website', 'LinkedIn', 'Email', 'Phone', 'City/Region', 'BC Region', 
                 'Category', 'AI Focus Areas', 'Short Blurb', 'Size'];
  let score = 0;
  
  fields.forEach(field => {
    if (getPropertyValue(page, field)) score++;
  });
  
  return score / fields.length;
}

async function prepareLogo() {
  console.log('🔍 Fetching organizations from Notion...');
  
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
  
  // Check existing logos in the logos directory
  const logoDir = path.join(process.cwd(), 'logos');
  const existingLogos = fs.existsSync(logoDir) ? fs.readdirSync(logoDir) : [];
  const existingLogoMap = {};
  
  existingLogos.forEach(filename => {
    // Extract organization name from filename
    const orgName = filename.replace(/_logo\.(png|jpg|svg|webp)$/i, '').replace(/_/g, ' ');
    existingLogoMap[orgName.toLowerCase()] = filename;
  });
  
  // Process organizations
  const orgsWithoutLogos = pages
    .map(page => {
      const name = getPropertyValue(page, 'Name');
      const website = getPropertyValue(page, 'Website');
      const completeness = calculateCompleteness(page);
      
      // Check if logo exists in directory
      const hasLogo = name && existingLogoMap[name.toLowerCase()];
      
      return {
        name,
        website,
        completeness,
        hasLogo,
        url: page.url
      };
    })
    .filter(org => !org.hasLogo && org.name); // Filter out orgs with logos and without names
  
  // Sort by completeness score (highest first)
  orgsWithoutLogos.sort((a, b) => b.completeness - a.completeness);
  
  // Generate markdown report
  const reportPath = path.join('reports', `${new Date().toISOString().split('T')[0]}_logo-acquisition-targets.md`);
  let reportContent = `# Logo Acquisition Targets\n\n`;
  reportContent += `*Generated on ${new Date().toLocaleString()}*\n\n`;
  reportContent += `Total organizations without logos: **${orgsWithoutLogos.length}**\n\n`;
  reportContent += `## Priority Organizations for Logo Acquisition\n\n`;
  reportContent += `These organizations are prioritized based on data completeness:\n\n`;
  reportContent += `| Organization | Website | Notion Page | Logo Filename |\n`;
  reportContent += `|-------------|---------|------------|---------------|\n`;
  
  // Show top 100 priority organizations
  orgsWithoutLogos.slice(0, 100).forEach(org => {
    const suggestedFilename = `${org.name.replace(/\s+/g, '_')}_logo.png`;
    reportContent += `| ${org.name} | ${org.website || ''} | [Notion](${org.url}) | \`${suggestedFilename}\` |\n`;
  });
  
  reportContent += `\n## Logo Acquisition Process\n\n`;
  reportContent += `1. **Find the logo** - Check company website or search "[Company Name] logo filetype:png" on Google\n`;
  reportContent += `2. **Save the file** - Use the suggested filename in the \`logos/\` directory\n`;
  reportContent += `3. **Optimize if needed** - Aim for transparent PNG files under 200KB\n`;
  reportContent += `4. **Update this document** - Mark completed acquisitions\n`;
  
  reportContent += `\n## Logo Upload Script\n\n`;
  reportContent += `After collecting logos, we'll create a script to batch upload them to Notion.\n`;
  
  // Ensure reports directory exists
  fs.mkdirSync('reports', { recursive: true });
  
  // Write file
  fs.writeFileSync(reportPath, reportContent);
  
  console.log(`✅ Logo acquisition targets written to: ${reportPath}`);
  console.log(`   Identified ${orgsWithoutLogos.length} organizations without logos`);
}

// Run the script
prepareLogo().catch(error => {
  console.error('Error:', error.message);
  if (error.body) console.error('API Error:', error.body);
  process.exit(1);
}); 