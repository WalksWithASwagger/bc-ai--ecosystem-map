#!/usr/bin/env node
/**
 * Categorize organizations that don't have categories
 */
const fs = require('fs');
const path = require('path');
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

// Category mapping based on keywords in organization names
const categoryMappings = {
  'Start-ups & Scale-ups': [
    'technologies', 'systems', 'software', 'labs', 'solutions', 'inc', 
    'corp', 'ltd', 'robotics', 'automation', 'platform', 'analytics'
  ],
  'Government & Public Sector': [
    'city of', 'bc government', 'government', 'public', 'ministry', 
    'service bc', 'first nations', 'municipal', 'regional district'
  ],
  'Academic & Research Labs': [
    'university', 'ubc', 'sfu', 'uvic', 'bcit', 'lab', 'research',
    'institute', 'centre', 'center', 'academic'
  ],
  'Industry Association': [
    'association', 'alliance', 'consortium', 'network', 'society',
    'council', 'chamber', 'board'
  ],
  'Innovation Centres & Hubs': [
    'innovation', 'hub', 'incubator', 'accelerator', 'catalyst'
  ],
  'Healthcare & Biotech': [
    'health', 'medical', 'biotech', 'pharma', 'therapeutics', 
    'diagnostics', 'clinical', 'patient', 'care'
  ],
  'Education & Training Providers': [
    'training', 'education', 'academy', 'school', 'learning',
    'certificate', 'program', 'course'
  ],
  'AI Companies': [
    'ai', 'artificial intelligence', 'machine learning', 'ml',
    'neural', 'cognitive', 'intelligent'
  ],
  'Technology Companies': [
    'tech', 'digital', 'software', 'hardware', 'cloud', 'data',
    'cyber', 'security', 'blockchain'
  ],
  'Service Providers': [
    'consulting', 'services', 'agency', 'studio', 'partners',
    'advisors', 'consultants'
  ],
  'Non-Profit': [
    'foundation', 'charity', 'non-profit', 'nonprofit', 'ngo',
    'community', 'volunteer'
  ],
  'Investors & Funding': [
    'capital', 'ventures', 'investment', 'fund', 'equity',
    'angel', 'vc', 'investor'
  ],
  'Events & Conferences': [
    'conference', 'summit', 'symposium', 'meetup', 'event',
    'workshop', 'seminar'
  ],
  'Media & Communications': [
    'media', 'news', 'journal', 'magazine', 'publication',
    'broadcast', 'communications'
  ]
};

async function findUncategorizedOrganizations() {
  console.log('🔍 Finding organizations without categories...\n');
  
  const organizations = [];
  let hasMore = true;
  let startCursor = undefined;
  
  while (hasMore) {
    const response = await notion.databases.query({
      database_id: dbId,
      filter: {
        property: 'Category',
        select: {
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
  
  return organizations;
}

function suggestCategory(orgName) {
  const nameLower = orgName.toLowerCase();
  
  // Check each category's keywords
  for (const [category, keywords] of Object.entries(categoryMappings)) {
    for (const keyword of keywords) {
      if (nameLower.includes(keyword)) {
        return category;
      }
    }
  }
  
  // Default suggestions based on patterns
  if (nameLower.includes('program') || nameLower.includes('initiative') || nameLower.includes('project')) {
    return 'Government & Public Sector';
  }
  
  if (nameLower.includes('.ai') || nameLower.includes(' ai ')) {
    return 'AI Companies';
  }
  
  return null;
}

async function categorizeOrganizations() {
  const organizations = await findUncategorizedOrganizations();
  console.log(`Found ${organizations.length} organizations without categories\n`);
  
  const results = {
    categorized: 0,
    skipped: 0,
    failed: 0,
    byCategory: {}
  };
  
  // Process first 50 organizations
  const limit = Math.min(50, organizations.length);
  
  for (let i = 0; i < limit; i++) {
    const org = organizations[i];
    const name = org.properties.Name.title[0]?.plain_text || 'Unknown';
    
    const suggestedCategory = suggestCategory(name);
    
    if (suggestedCategory) {
      console.log(`✅ ${name} → ${suggestedCategory}`);
      
      try {
        await notion.pages.update({
          page_id: org.id,
          properties: {
            Category: { 
              select: { 
                name: suggestedCategory 
              } 
            }
          }
        });
        
        results.categorized++;
        if (!results.byCategory[suggestedCategory]) {
          results.byCategory[suggestedCategory] = 0;
        }
        results.byCategory[suggestedCategory]++;
        
      } catch (error) {
        console.error(`   ❌ Failed to update: ${error.message}`);
        results.failed++;
      }
    } else {
      console.log(`⏭️  ${name} - No clear category`);
      results.skipped++;
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Results:');
  console.log(`   ✅ Organizations categorized: ${results.categorized}`);
  console.log(`   ⏭️ Organizations skipped: ${results.skipped}`);
  console.log(`   ❌ Failed operations: ${results.failed}`);
  console.log(`   📁 Remaining uncategorized: ${organizations.length - limit}`);
  
  console.log('\n📊 Categories assigned:');
  Object.entries(results.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      console.log(`   ${category}: ${count}`);
    });
  
  // Generate report
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(__dirname, '..', 'reports', `${timestamp}_categorization-report.md`);
  
  let report = `# Organization Categorization Report

*Generated on ${new Date().toLocaleString()}*

## Summary

- **Organizations Processed**: ${limit}
- **Organizations Categorized**: ${results.categorized}
- **Organizations Skipped**: ${results.skipped}
- **Failed Operations**: ${results.failed}
- **Remaining Uncategorized**: ${organizations.length - limit}

## Categories Assigned

| Category | Count |
|----------|-------|
`;

  Object.entries(results.byCategory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, count]) => {
      report += `| ${category} | ${count} |\n`;
    });

  report += `
## Notes

Organizations were categorized based on keywords in their names. The following mappings were used:

${Object.entries(categoryMappings).map(([cat, keywords]) => 
  `- **${cat}**: ${keywords.slice(0, 5).join(', ')}...`
).join('\n')}

Organizations without clear keywords were skipped and may need manual categorization.
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Report written to: ${reportPath}`);
}

// Run the script
categorizeOrganizations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});