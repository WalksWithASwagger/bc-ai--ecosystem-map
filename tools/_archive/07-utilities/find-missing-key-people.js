#!/usr/bin/env node
/**
 * Find organizations with missing key people information
 * Usage: NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/find-missing-key-people.js
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
    default:
      return null;
  }
}

// Calculate research potential score
// Higher score = better candidate for key people research
function calculateResearchPotential(org) {
  let score = 0;
  
  // Website is most important for finding key people
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

async function findMissingKeyPeople() {
  console.log('🔍 Scanning for organizations missing key people information...');
  
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
  const orgsWithoutKeyPeople = pages
    .map(page => {
      const name = getPropertyValue(page, 'Name') || 'Unknown Organization';
      const keyPeople = getPropertyValue(page, 'Key People');
      const website = getPropertyValue(page, 'Website');
      const linkedin = getPropertyValue(page, 'LinkedIn');
      const category = getPropertyValue(page, 'Category');
      const region = getPropertyValue(page, 'BC Region');
      const shortBlurb = getPropertyValue(page, 'Short Blurb');
      
      return {
        name,
        url: page.url,
        hasKeyPeople: !!keyPeople,
        website,
        linkedin,
        category,
        region,
        shortBlurb
      };
    })
    .filter(org => !org.hasKeyPeople);
  
  // Calculate research potential for each org
  orgsWithoutKeyPeople.forEach(org => {
    org.researchPotential = calculateResearchPotential(org);
  });
  
  // Sort by research potential (highest first)
  orgsWithoutKeyPeople.sort((a, b) => b.researchPotential - a.researchPotential);
  
  // Generate markdown report
  const reportPath = path.join('reports', `${new Date().toISOString().split('T')[0]}_missing-key-people.md`);
  let reportContent = `# Organizations Missing Key People Information\n\n`;
  reportContent += `*Generated on ${new Date().toLocaleString()}*\n\n`;
  reportContent += `Total organizations missing key people: **${orgsWithoutKeyPeople.length}** (${Math.round((orgsWithoutKeyPeople.length / pages.length) * 100)}% of database)\n\n`;
  
  // Priority organizations (with website and/or LinkedIn)
  const highPriority = orgsWithoutKeyPeople.filter(org => org.website || org.linkedin);
  reportContent += `## Priority Organizations for Key People Research (${highPriority.length})\n\n`;
  reportContent += `These organizations have websites and/or LinkedIn profiles, making them ideal candidates for key people research:\n\n`;
  reportContent += `| Organization | Website | LinkedIn | Category | BC Region |\n`;
  reportContent += `|-------------|---------|----------|----------|----------|\n`;
  
  highPriority.slice(0, 50).forEach(org => {
    reportContent += `| [${org.name}](${org.url}) | ${org.website ? `[Website](${org.website})` : ''} | ${org.linkedin ? `[LinkedIn](${org.linkedin})` : ''} | ${org.category || ''} | ${org.region || ''} |\n`;
  });
  
  if (highPriority.length > 50) {
    reportContent += `\n*...and ${highPriority.length - 50} more organizations*\n`;
  }
  
  // Organizations by category
  reportContent += `\n## Missing Key People by Category\n\n`;
  
  // Group by category
  const categoryGroups = {};
  orgsWithoutKeyPeople.forEach(org => {
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
  reportContent += `## Key People Research Methodology\n\n`;
  reportContent += `### Sources for Key People Information\n\n`;
  reportContent += `1. **Company Website**: Check "About", "Team", "Leadership", or "Contact" pages\n`;
  reportContent += `2. **LinkedIn**: Company page often lists key employees and leadership\n`;
  reportContent += `3. **Crunchbase**: Provides founder and executive information\n`;
  reportContent += `4. **BC Business Registry**: Can provide director information\n`;
  reportContent += `5. **Press Releases**: Often mention founders and executives\n`;
  reportContent += `6. **Industry News**: Articles about the company may mention leadership\n\n`;
  
  reportContent += `### Data Format Guidelines\n\n`;
  reportContent += `Format key people information consistently as:\n\n`;
  reportContent += `\`\`\`\n`;
  reportContent += `First Last (Title), First Last (Title), First Last (Title)\n`;
  reportContent += `\`\`\`\n\n`;
  reportContent += `Examples:\n`;
  reportContent += `- \`Jane Smith (CEO), John Doe (CTO), Alex Wong (COO)\`\n`;
  reportContent += `- \`Dr. James Wilson (Founder & Chief Scientist), Sarah Chen (Managing Director)\`\n\n`;
  
  reportContent += `### Batch Processing Strategy\n\n`;
  reportContent += `1. **Start with high-potential organizations**: Those with websites and LinkedIn profiles\n`;
  reportContent += `2. **Process by category**: Research similar companies together to leverage industry knowledge\n`;
  reportContent += `3. **Regional batches**: Process organizations by region to leverage local knowledge\n`;
  reportContent += `4. **Update in batches**: Use the Notion API to update multiple organizations at once\n`;
  
  // Ensure reports directory exists
  fs.mkdirSync('reports', { recursive: true });
  
  // Write file
  fs.writeFileSync(reportPath, reportContent);
  
  console.log(`✅ Missing key people report written to: ${reportPath}`);
  console.log(`   Found ${orgsWithoutKeyPeople.length} organizations missing key people information`);
}

// Run the script
findMissingKeyPeople().catch(error => {
  console.error('Error:', error.message);
  if (error.body) console.error('API Error:', error.body);
  process.exit(1);
}); 