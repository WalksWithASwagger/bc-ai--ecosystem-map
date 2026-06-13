#!/usr/bin/env node
/**
 * Find high-priority organizations for intelligence gathering
 * Prioritizes: Has website, missing funding/revenue, likely funded companies
 */

const { Client } = require('@notionhq/client');
require('dotenv').config();

// Configuration
let config = {};
try {
  config = require('./config');
} catch (e) {
  // Use environment variables
}

const notionToken = config.NOTION_TOKEN || process.env.NOTION_TOKEN;
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

if (!notionToken || !dbId) {
  console.error('❌ Notion credentials required');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });

// Helper function to safely extract property values
function getPropertyValue(page, propName) {
  const prop = page.properties[propName];
  if (!prop) return null;

  switch (prop.type) {
    case 'title':
      return prop.title.length > 0 ? prop.title[0].plain_text : null;
    case 'rich_text':
      return prop.rich_text.length > 0 ? prop.rich_text[0].plain_text : null;
    case 'url':
      return prop.url || null;
    case 'select':
      return prop.select?.name || null;
    case 'number':
      return prop.number;
    default:
      return null;
  }
}

async function findPriorityTargets() {
  console.log('🎯 Finding Priority Intelligence Targets\n');
  
  // Get all organizations with websites
  const organizations = [];
  let cursor;
  
  do {
    const response = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      filter: {
        property: 'Website',
        url: { is_not_empty: true }
      },
      page_size: 100
    });
    
    organizations.push(...response.results);
    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor);
  
  console.log(`Found ${organizations.length} organizations with websites\n`);
  
  // Analyze and score organizations
  const priorities = organizations.map(org => {
    const name = getPropertyValue(org, 'Name');
    const category = getPropertyValue(org, 'Category');
    const size = getPropertyValue(org, 'Size');
    const website = getPropertyValue(org, 'Website');
    const linkedin = getPropertyValue(org, 'LinkedIn');
    const funding = getPropertyValue(org, 'Funding');
    const revenue = getPropertyValue(org, 'Revenue');
    const employeeCount = getPropertyValue(org, 'Employee Count');
    const yearFounded = getPropertyValue(org, 'Year Founded');
    
    // Calculate priority score
    let score = 0;
    
    // High priority if startup/scale-up without funding data
    if ((category?.includes('Start') || category?.includes('Scale') || size?.includes('Start')) && !funding) {
      score += 10;
    }
    
    // Medium priority if missing employee data
    if (!employeeCount) score += 5;
    
    // Medium priority if missing revenue but likely has it
    if (!revenue && (category?.includes('Enterprise') || size?.includes('250+'))) {
      score += 5;
    }
    
    // Bonus if has LinkedIn (easier to verify)
    if (linkedin) score += 3;
    
    // Bonus if missing year founded
    if (!yearFounded) score += 2;
    
    // Extra priority for certain categories
    const highValueCategories = ['Unicorn', 'Scale-up', 'Enterprise', 'AI Platform'];
    if (highValueCategories.some(cat => category?.includes(cat))) {
      score += 5;
    }
    
    return {
      name,
      id: org.id,
      category,
      size,
      website,
      linkedin,
      missingData: {
        funding: !funding,
        revenue: !revenue,
        employeeCount: !employeeCount,
        yearFounded: !yearFounded
      },
      score
    };
  });
  
  // Sort by priority score
  priorities.sort((a, b) => b.score - a.score);
  
  // Get top priorities
  const topPriorities = priorities.filter(p => p.score > 0).slice(0, 30);
  
  // Generate report
  console.log('## 🎯 Top 30 Priority Organizations for Intelligence Gathering\n');
  console.log('| Rank | Organization | Category | Score | Missing Data | Links |');
  console.log('|------|-------------|----------|-------|--------------|-------|');
  
  topPriorities.forEach((org, index) => {
    const missing = [];
    if (org.missingData.funding) missing.push('💰');
    if (org.missingData.revenue) missing.push('💵');
    if (org.missingData.employeeCount) missing.push('👥');
    if (org.missingData.yearFounded) missing.push('📅');
    
    const links = [];
    if (org.website) links.push('[Web]('+org.website+')');
    if (org.linkedin) links.push('[LI]('+org.linkedin+')');
    
    console.log(`| ${index + 1} | ${org.name} | ${org.category || 'Unknown'} | ${org.score} | ${missing.join(' ')} | ${links.join(' ')} |`);
  });
  
  // Summary by category
  console.log('\n## 📊 Summary by Category\n');
  const byCategory = {};
  topPriorities.forEach(org => {
    const cat = org.category || 'Unknown';
    if (!byCategory[cat]) byCategory[cat] = 0;
    byCategory[cat]++;
  });
  
  Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      console.log(`- ${cat}: ${count} organizations`);
    });
  
  // Key insights
  console.log('\n## 💡 Key Insights\n');
  const missingFunding = topPriorities.filter(p => p.missingData.funding).length;
  const missingRevenue = topPriorities.filter(p => p.missingData.revenue).length;
  const missingEmployees = topPriorities.filter(p => p.missingData.employeeCount).length;
  
  console.log(`- ${missingFunding} organizations likely have funding data on Crunchbase`);
  console.log(`- ${missingRevenue} organizations may have revenue information available`);
  console.log(`- ${missingEmployees} organizations need LinkedIn employee count updates`);
  console.log(`- Focus on startups and scale-ups first for maximum impact`);
  
  // Generate CSV for batch processing
  const csvPath = 'data/reports/priority-intelligence-targets.csv';
  let csv = 'Name,Category,Website,LinkedIn,Priority Score,Missing Funding,Missing Revenue,Missing Employees\n';
  
  topPriorities.forEach(org => {
    csv += `"${org.name}","${org.category || ''}","${org.website || ''}","${org.linkedin || ''}",${org.score},${org.missingData.funding},${org.missingData.revenue},${org.missingData.employeeCount}\n`;
  });
  
  require('fs').writeFileSync(csvPath, csv);
  console.log(`\n✅ Priority list saved to: ${csvPath}`);
}

findPriorityTargets().catch(console.error);