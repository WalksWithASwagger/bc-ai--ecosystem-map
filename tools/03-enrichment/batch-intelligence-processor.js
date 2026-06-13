#!/usr/bin/env node
/**
 * Batch Intelligence Processor
 * Efficiently process and validate intelligence for multiple organizations
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
require('dotenv').config();

// Configuration
let config = {};
try {
  config = require('../config');
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

// Template for batch data entry
const batchTemplate = {
  organizations: [
    {
      name: "Example Company",
      funding: {
        amount: "$10M Series A",
        date: "2024-06",
        investors: "Sequoia Capital, Andreessen Horowitz",
        source: "https://techcrunch.com/example"
      },
      employeeCount: {
        count: "50-100",
        asOf: "2025-07",
        source: "https://linkedin.com/company/example"
      },
      revenue: {
        amount: "$5M ARR",
        year: "2024",
        source: "https://example.com/press"
      },
      keyPeople: {
        people: "Jane Doe (CEO), John Smith (CTO)",
        source: "https://example.com/team"
      }
    }
  ]
};

// Find organization in database
async function findOrganization(name) {
  try {
    const response = await notion.databases.query({
      database_id: dbId,
      filter: {
        property: 'Name',
        title: { equals: name }
      }
    });
    
    return response.results.length > 0 ? response.results[0] : null;
  } catch (error) {
    console.error(`Error finding ${name}:`, error.message);
    return null;
  }
}

// Format intelligence for database update
function formatIntelligence(org) {
  const updates = {
    organization: org.name,
    pageId: null, // Will be filled by findOrganization
    updates: {}
  };
  
  if (org.funding) {
    updates.updates.funding = {
      value: `${org.funding.amount}${org.funding.date ? ` (${org.funding.date})` : ''}${org.funding.investors ? ` - ${org.funding.investors}` : ''}`,
      source: org.funding.source,
      lastVerified: new Date().toISOString()
    };
  }
  
  if (org.employeeCount) {
    updates.updates.employeeCount = {
      value: `${org.employeeCount.count}${org.employeeCount.asOf ? ` (as of ${org.employeeCount.asOf})` : ''}`,
      source: org.employeeCount.source,
      lastVerified: new Date().toISOString()
    };
  }
  
  if (org.revenue) {
    updates.updates.revenue = {
      value: `${org.revenue.amount}${org.revenue.year ? ` (${org.revenue.year})` : ''}`,
      source: org.revenue.source,
      lastVerified: new Date().toISOString()
    };
  }
  
  if (org.valuation) {
    updates.updates.valuation = {
      value: `${org.valuation.amount}${org.valuation.date ? ` (${org.valuation.date})` : ''}`,
      source: org.valuation.source,
      lastVerified: new Date().toISOString()
    };
  }
  
  if (org.keyPeople) {
    updates.updates.keyPeople = {
      value: org.keyPeople.people,
      source: org.keyPeople.source,
      lastVerified: new Date().toISOString()
    };
  }
  
  if (org.yearFounded) {
    updates.updates.yearFounded = {
      value: org.yearFounded.year,
      source: org.yearFounded.source,
      lastVerified: new Date().toISOString()
    };
  }
  
  return updates;
}

// Process batch data
async function processBatch(inputFile) {
  console.log('🚀 BC AI Batch Intelligence Processor');
  console.log('=====================================\n');
  
  // Load input file
  let batchData;
  try {
    const content = fs.readFileSync(inputFile, 'utf8');
    batchData = JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error reading input file: ${error.message}`);
    console.log('\n💡 Expected format:');
    console.log(JSON.stringify(batchTemplate, null, 2));
    process.exit(1);
  }
  
  if (!batchData.organizations || !Array.isArray(batchData.organizations)) {
    console.error('❌ Invalid format: missing organizations array');
    process.exit(1);
  }
  
  console.log(`📋 Processing ${batchData.organizations.length} organizations\n`);
  
  const results = {
    processed: 0,
    found: 0,
    notFound: [],
    updates: []
  };
  
  // Process each organization
  for (const org of batchData.organizations) {
    console.log(`🔍 Processing ${org.name}...`);
    results.processed++;
    
    // Find in database
    const dbOrg = await findOrganization(org.name);
    
    if (!dbOrg) {
      console.log(`   ❌ Not found in database`);
      results.notFound.push(org.name);
      continue;
    }
    
    console.log(`   ✅ Found in database`);
    results.found++;
    
    // Format updates
    const updates = formatIntelligence(org);
    updates.pageId = dbOrg.id;
    
    // Count what we're updating
    const updateCount = Object.keys(updates.updates).length;
    console.log(`   📊 ${updateCount} data points to update`);
    
    results.updates.push(updates);
  }
  
  // Generate output files
  const timestamp = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const outputDir = path.join(__dirname, '../../data/research');
  
  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Save validated updates
  const validatedPath = path.join(outputDir, `${timestamp}_${time}_validated-batch-25.json`);
  fs.writeFileSync(validatedPath, JSON.stringify(results.updates, null, 2));
  
  // Generate summary report
  let report = `# Batch Intelligence Processing Report\n\n`;
  report += `*Date: ${new Date().toLocaleString()}*\n\n`;
  report += `## Summary\n\n`;
  report += `- **Organizations Processed**: ${results.processed}\n`;
  report += `- **Found in Database**: ${results.found}\n`;
  report += `- **Not Found**: ${results.notFound.length}\n\n`;
  
  if (results.notFound.length > 0) {
    report += `## Organizations Not Found\n\n`;
    results.notFound.forEach(name => {
      report += `- ${name}\n`;
    });
    report += `\n`;
  }
  
  report += `## Updates Ready\n\n`;
  results.updates.forEach(update => {
    report += `### ${update.organization}\n`;
    Object.entries(update.updates).forEach(([field, data]) => {
      report += `- **${field}**: ${data.value}\n`;
      report += `  - Source: ${data.source}\n`;
    });
    report += `\n`;
  });
  
  const reportPath = path.join(outputDir, `${timestamp}_${time}_batch-25-report.md`);
  fs.writeFileSync(reportPath, report);
  
  // Final summary
  console.log('\n📊 Processing Complete:');
  console.log(`   ✅ Found: ${results.found}/${results.processed}`);
  console.log(`   ❌ Not found: ${results.notFound.length}`);
  console.log(`\n📄 Output files:`);
  console.log(`   - Validated updates: ${validatedPath}`);
  console.log(`   - Summary report: ${reportPath}`);
  
  if (results.updates.length > 0) {
    console.log(`\n💡 Next step:`);
    console.log(`   node tools/enhancement/apply-validated-intelligence.js --updates=${validatedPath} --no-dryrun`);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node batch-intelligence-processor.js <input-file.json>');
  console.log('\nExample input format:');
  console.log(JSON.stringify(batchTemplate, null, 2));
  process.exit(0);
}

processBatch(args[0]).catch(console.error);