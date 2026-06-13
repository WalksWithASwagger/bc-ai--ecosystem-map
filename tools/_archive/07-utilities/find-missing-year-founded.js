#!/usr/bin/env node
/**
 * Find organizations with missing Year Founded information
 * Usage: NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/find-missing-year-founded.js
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
    case 'number':
      return prop.number !== null ? prop.number : null;
    default:
      return null;
  }
}

// Calculate research potential score
function calculateResearchPotential(org) {
  let score = 0;
  
  // Website is most important for finding founding year
  if (org.website) score += 5;
  
  // LinkedIn is second most important
  if (org.linkedin) score += 4;
  
  // Having a short blurb helps understand the company
  if (org.shortBlurb) score += 2;
  
  // Category and region help with context
  if (org.category) score += 1;
  if (org.region) score += 1;
  
  return score;
}

async function findMissingYearFounded() {
  console.log('🔍 Scanning for organizations missing Year Founded information...');
  
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
  const orgsWithoutYearFounded = pages
    .map(page => {
      const name = getPropertyValue(page, 'Name') || 'Unknown Organization';
      const yearFounded = getPropertyValue(page, 'Year Founded');
      const website = getPropertyValue(page, 'Website');
      const linkedin = getPropertyValue(page, 'LinkedIn');
      const category = getPropertyValue(page, 'Category');
      const region = getPropertyValue(page, 'BC Region');
      const shortBlurb = getPropertyValue(page, 'Short Blurb');
      
      return {
        name,
        url: page.url,
        hasYearFounded: yearFounded !== null,
        website,
        linkedin,
        category,
        region,
        shortBlurb
      };
    })
    .filter(org => !org.hasYearFounded);
  
  // Calculate research potential for each org
  orgsWithoutYearFounded.forEach(org => {
    org.researchPotential = calculateResearchPotential(org);
  });
  
  // Sort by research potential (highest first)
  orgsWithoutYearFounded.sort((a, b) => b.researchPotential - a.researchPotential);
  
  // Generate markdown report
  const reportPath = path.join('reports', `${new Date().toISOString().split('T')[0]}_missing-year-founded.md`);
  let reportContent = `# Organizations Missing Year Founded Information\n\n`;
  reportContent += `*Generated on ${new Date().toLocaleString()}*\n\n`;
  reportContent += `Total organizations missing Year Founded: **${orgsWithoutYearFounded.length}** (${Math.round((orgsWithoutYearFounded.length / pages.length) * 100)}% of database)\n\n`;
  
  // Priority organizations (with website and/or LinkedIn)
  const highPriority = orgsWithoutYearFounded.filter(org => org.website || org.linkedin);
  reportContent += `## Priority Organizations for Year Founded Research (${highPriority.length})\n\n`;
  reportContent += `These organizations have websites and/or LinkedIn profiles, making them ideal candidates for Year Founded research:\n\n`;
  reportContent += `| Organization | Website | LinkedIn | Category | BC Region |\n`;
  reportContent += `|-------------|---------|----------|----------|----------|\n`;
  
  highPriority.slice(0, 50).forEach(org => {
    reportContent += `| [${org.name}](${org.url}) | ${org.website ? `[Website](${org.website})` : ''} | ${org.linkedin ? `[LinkedIn](${org.linkedin})` : ''} | ${org.category || ''} | ${org.region || ''} |\n`;
  });
  
  if (highPriority.length > 50) {
    reportContent += `\n*...and ${highPriority.length - 50} more organizations*\n`;
  }
  
  // Organizations by category
  reportContent += `\n## Missing Year Founded by Category\n\n`;
  
  // Group by category
  const categoryGroups = {};
  orgsWithoutYearFounded.forEach(org => {
    const category = org.category || 'Uncategorized';
    if (!categoryGroups[category]) {
      categoryGroups[category] = [];
    }
    categoryGroups[category].push(org);
  });
  
  // Sort categories by number of orgs (most first)
  const sortedCategories = Object.keys(categoryGroups).sort((a, b) => 
    categoryGroups[b].length - categoryGroups[a].length
  );
  
  sortedCategories.forEach(category => {
    const orgs = categoryGroups[category];
    reportContent += `### ${category} (${orgs.length})\n\n`;
    
    // For each category, show top 5 orgs by research potential
    const topOrgs = [...orgs].sort((a, b) => b.researchPotential - a.researchPotential).slice(0, 5);
    
    if (topOrgs.length > 0) {
      reportContent += `| Organization | Has Website | Has LinkedIn | BC Region |\n`;
      reportContent += `|-------------|------------|-------------|----------|\n`;
      
      topOrgs.forEach(org => {
        reportContent += `| [${org.name}](${org.url}) | ${org.website ? '✅' : '❌'} | ${org.linkedin ? '✅' : '❌'} | ${org.region || ''} |\n`;
      });
      
      if (orgs.length > 5) {
        reportContent += `\n*...and ${orgs.length - 5} more ${category} organizations*\n`;
      }
    }
    
    reportContent += `\n`;
  });
  
  // Research methodology
  reportContent += `## Year Founded Research Methodology\n\n`;
  reportContent += `### Sources for Year Founded Information\n\n`;
  reportContent += `1. **Company Website**: Check "About", "History", or "Our Story" pages\n`;
  reportContent += `2. **LinkedIn**: Company page typically includes founding year\n`;
  reportContent += `3. **Crunchbase**: Provides detailed company timeline information\n`;
  reportContent += `4. **BC Business Registry**: Provides incorporation date\n`;
  reportContent += `5. **Press Releases**: First press release or company announcement\n`;
  reportContent += `6. **Industry News**: Articles about company founding or launch\n\n`;
  
  reportContent += `### Data Format Guidelines\n\n`;
  reportContent += `- Enter Year Founded as a 4-digit number (e.g., \`2015\`)\n`;
  reportContent += `- For companies with multiple founding dates (e.g., original founding and incorporation), use the earliest date\n`;
  reportContent += `- If only approximate year is known, still enter the year\n`;
  reportContent += `- If month/day is known, still only enter the year in the Year Founded field\n\n`;
  
  reportContent += `### Batch Update Script\n\n`;
  reportContent += `After researching year founded information, a batch update script can be created to update multiple organizations at once:\n\n`;
  reportContent += `\`\`\`javascript\n`;
  reportContent += `// Example batch update script structure\n`;
  reportContent += `const updates = [\n`;
  reportContent += `  { id: "page_id_1", yearFounded: 2018 },\n`;
  reportContent += `  { id: "page_id_2", yearFounded: 2015 },\n`;
  reportContent += `  // etc.\n`;
  reportContent += `];\n\n`;
  reportContent += `for (const update of updates) {\n`;
  reportContent += `  await notion.pages.update({\n`;
  reportContent += `    page_id: update.id,\n`;
  reportContent += `    properties: {\n`;
  reportContent += `      "Year Founded": { number: update.yearFounded }\n`;
  reportContent += `    }\n`;
  reportContent += `  });\n`;
  reportContent += `}\n`;
  reportContent += `\`\`\`\n`;
  
  // Ensure reports directory exists
  fs.mkdirSync('reports', { recursive: true });
  
  // Write file
  fs.writeFileSync(reportPath, reportContent);
  
  console.log(`✅ Missing Year Founded report written to: ${reportPath}`);
  console.log(`   Found ${orgsWithoutYearFounded.length} organizations missing Year Founded information`);
}

// Run the script
findMissingYearFounded().catch(error => {
  console.error('Error:', error.message);
  if (error.body) console.error('API Error:', error.body);
  process.exit(1);
}); 