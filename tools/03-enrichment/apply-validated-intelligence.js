#!/usr/bin/env node
/**
 * Apply Validated Intelligence - Safely update database with verified intelligence
 * This tool reads validated intelligence reports and applies updates with full citation tracking
 * 
 * Usage: node tools/enhancement/apply-validated-intelligence.js --updates=path/to/updates.json
 * 
 * Options:
 *   --updates=path   Path to the validated updates JSON file
 *   --verify         Double-check all sources before applying
 *   --dryrun         Show what would be updated without making changes
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const axios = require('axios');
require('dotenv').config();

// Configuration
let config = {};
try {
  config = require('../config');
} catch (e) {
  // Use environment variables
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  updatesFile: null,
  verify: true,
  dryrun: true
};

args.forEach(arg => {
  if (arg.startsWith('--updates=')) {
    options.updatesFile = arg.split('=')[1];
  } else if (arg === '--verify') {
    options.verify = true;
  } else if (arg === '--no-verify') {
    options.verify = false;
  } else if (arg === '--dryrun') {
    options.dryrun = true;
  } else if (arg === '--no-dryrun') {
    options.dryrun = false;
  }
});

if (!options.updatesFile) {
  console.error('❌ Error: --updates parameter is required');
  console.error('Usage: node apply-validated-intelligence.js --updates=path/to/updates.json');
  process.exit(1);
}

// Notion setup
const notionToken = config.NOTION_TOKEN || process.env.NOTION_TOKEN;
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

if (!notionToken || !dbId) {
  console.error('❌ Notion credentials required. Set in config.js or environment.');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });

// Verify a source is still accessible
async function verifySource(url) {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BC-AI-Intelligence-Bot/1.0)'
      }
    });
    return response.status === 200;
  } catch (error) {
    // Try GET if HEAD fails
    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BC-AI-Intelligence-Bot/1.0)'
        }
      });
      return response.status === 200;
    } catch (err) {
      return false;
    }
  }
}

// Format citation for database
function formatCitation(data) {
  const date = new Date(data.lastVerified).toLocaleDateString();
  return `${data.value} (Source: ${data.source} - Verified ${date})`;
}

// Apply updates to Notion
async function applyUpdate(pageId, updates, orgName) {
  const properties = {};
  const citations = [];
  
  // Prepare properties based on available fields in the database
  if (updates.funding) {
    // Store funding info in the Funding field with citation
    properties['Funding'] = {
      rich_text: [{
        type: 'text',
        text: { content: formatCitation(updates.funding) }
      }]
    };
    citations.push(`Funding: ${updates.funding.source}`);
  }
  
  if (updates.yearFounded) {
    // Year Founded is a number field
    properties['Year Founded'] = {
      number: updates.yearFounded.value
    };
    citations.push(`Year Founded: ${updates.yearFounded.source}`);
  }
  
  if (updates.employeeCount) {
    // Use the new Employee Count field
    properties['Employee Count'] = {
      rich_text: [{
        type: 'text',
        text: { content: formatCitation(updates.employeeCount) }
      }]
    };
    citations.push(`Employees: ${updates.employeeCount.source}`);
  }
  
  if (updates.revenue) {
    // Store in Revenue field
    properties['Revenue'] = {
      rich_text: [{
        type: 'text',
        text: { content: formatCitation(updates.revenue) }
      }]
    };
    citations.push(`Revenue: ${updates.revenue.source}`);
  }
  
  if (updates.valuation) {
    // Store in Valuation field
    properties['Valuation'] = {
      rich_text: [{
        type: 'text',
        text: { content: formatCitation(updates.valuation) }
      }]
    };
    citations.push(`Valuation: ${updates.valuation.source}`);
  }
  
  if (updates.keyPeople) {
    // Store in Key People field
    properties['Key People'] = {
      rich_text: [{
        type: 'text',
        text: { content: updates.keyPeople.value }
      }]
    };
    citations.push(`Key People: ${updates.keyPeople.source}`);
  }
  
  // Add citations to Data Sources field
  if (citations.length > 0) {
    const citationText = `Verified ${new Date().toLocaleDateString()}:\n` + 
                        citations.join('\n');
    
    properties['Data Sources'] = {
      rich_text: [{
        type: 'text',
        text: { content: citationText }
      }]
    };
  }
  
  // Set Last Verified date
  properties['Last Verified'] = {
    date: { start: new Date().toISOString().split('T')[0] }
  };
  
  if (options.dryrun) {
    console.log(`[DRY RUN] Would update ${orgName}:`);
    console.log(JSON.stringify(properties, null, 2));
    return { success: true, dryrun: true };
  }
  
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: properties
    });
    return { success: true, properties };
  } catch (error) {
    console.error(`Failed to update ${orgName}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Main function
async function main() {
  console.log('🔐 BC AI Validated Intelligence Applicator');
  console.log('=========================================\n');
  
  // Load updates file
  let updates;
  try {
    const fileContent = fs.readFileSync(options.updatesFile, 'utf8');
    updates = JSON.parse(fileContent);
  } catch (error) {
    console.error(`❌ Error reading updates file: ${error.message}`);
    process.exit(1);
  }
  
  console.log(`📋 Loaded ${updates.length} organizations to update`);
  
  if (options.dryrun) {
    console.log('🔒 Running in DRY RUN mode - no database changes will be made\n');
  }
  
  if (options.verify) {
    console.log('🔍 Verification mode enabled - checking all sources\n');
  }
  
  // Process each update
  const results = {
    processed: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    details: []
  };
  
  for (const update of updates) {
    console.log(`\n📊 Processing ${update.organization}...`);
    results.processed++;
    
    // Verify sources if requested
    if (options.verify) {
      console.log('  🔍 Verifying sources...');
      let allSourcesValid = true;
      
      for (const [field, data] of Object.entries(update.updates)) {
        if (data.source && data.source.startsWith('http')) {
          const isValid = await verifySource(data.source);
          if (!isValid) {
            console.log(`  ❌ Source unavailable for ${field}: ${data.source}`);
            allSourcesValid = false;
          } else {
            console.log(`  ✅ Source verified for ${field}`);
          }
        }
      }
      
      if (!allSourcesValid && !options.dryrun) {
        console.log('  ⏭️  Skipping due to unverified sources');
        results.skipped++;
        results.details.push({
          organization: update.organization,
          status: 'skipped',
          reason: 'Source verification failed'
        });
        continue;
      }
    }
    
    // Apply the update
    const result = await applyUpdate(update.pageId, update.updates, update.organization);
    
    if (result.success) {
      if (result.dryrun) {
        results.details.push({
          organization: update.organization,
          status: 'would update',
          updates: update.updates
        });
      } else {
        console.log(`  ✅ Successfully updated ${update.organization}`);
        results.updated++;
        results.details.push({
          organization: update.organization,
          status: 'updated',
          properties: result.properties
        });
      }
    } else {
      results.failed++;
      results.details.push({
        organization: update.organization,
        status: 'failed',
        error: result.error
      });
    }
  }
  
  // Generate report
  const timestamp = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const reportDir = path.join(__dirname, '../../data/reports');
  const reportPath = path.join(reportDir, `${timestamp}_${time}_intelligence-application.md`);
  
  let report = `# Intelligence Application Report\n\n`;
  report += `*Generated: ${new Date().toLocaleString()}*\n\n`;
  report += `## Summary\n\n`;
  report += `- **Mode**: ${options.dryrun ? 'DRY RUN' : 'LIVE UPDATE'}\n`;
  report += `- **Source Verification**: ${options.verify ? 'ENABLED' : 'DISABLED'}\n`;
  report += `- **Organizations Processed**: ${results.processed}\n`;
  report += `- **Successfully Updated**: ${results.updated}\n`;
  report += `- **Skipped**: ${results.skipped}\n`;
  report += `- **Failed**: ${results.failed}\n\n`;
  
  // Add details
  report += `## Update Details\n\n`;
  
  results.details.forEach(detail => {
    report += `### ${detail.organization}\n`;
    report += `- **Status**: ${detail.status}\n`;
    
    if (detail.updates) {
      report += `- **Updates Applied**:\n`;
      Object.entries(detail.updates).forEach(([field, data]) => {
        report += `  - ${field}: ${data.value} ([source](${data.source}))\n`;
      });
    }
    
    if (detail.error) {
      report += `- **Error**: ${detail.error}\n`;
    }
    
    if (detail.reason) {
      report += `- **Reason**: ${detail.reason}\n`;
    }
    
    report += `\n`;
  });
  
  // Ensure reports directory exists
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  // Write report
  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Application report written to: ${reportPath}`);
  
  // Summary
  console.log('\n📊 Final Summary:');
  console.log(`   ✅ Processed: ${results.processed}`);
  console.log(`   ✅ Updated: ${results.updated}`);
  console.log(`   ⏭️  Skipped: ${results.skipped}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  
  if (options.dryrun) {
    console.log('\n💡 This was a DRY RUN. To apply changes, run with --no-dryrun');
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});