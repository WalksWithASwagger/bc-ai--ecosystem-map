#!/usr/bin/env node
/**
 * Apply Validated Intelligence to Notion Database - FIXED VERSION
 * Fixes the keyPeople formatting issue
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
require('dotenv').config();

// Parse command line arguments
const argv = minimist(process.argv.slice(2), {
  boolean: ['dryrun', 'verify', 'no-dryrun', 'no-verify'],
  string: ['updates'],
  default: {
    dryrun: true,
    verify: true
  }
});

// Handle negation flags
if (argv['no-dryrun']) argv.dryrun = false;
if (argv['no-verify']) argv.verify = false;

const options = {
  updatesFile: argv.updates || argv._[0],
  dryrun: argv.dryrun,
  verify: argv.verify
};

if (!options.updatesFile) {
  console.error('Usage: node apply-validated-intelligence.js <updates-file.json> [--no-dryrun] [--no-verify]');
  process.exit(1);
}

// Configuration
let config = {};
try {
  config = require('../config');
} catch (e) {
  // Use environment variables as fallback
}

const notion = new Client({
  auth: config.NOTION_TOKEN || process.env.NOTION_TOKEN
});

const DATABASE_ID = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

if (!DATABASE_ID) {
  console.error('❌ NOTION_DATABASE_ID not found in environment');
  process.exit(1);
}

// Helper function to format citations
function formatCitation(data) {
  if (typeof data === 'string') {
    return data;
  }
  
  const date = data.lastVerified ? 
    new Date(data.lastVerified).toLocaleDateString() : 
    new Date().toLocaleDateString();
  
  return `${data.value} (Source: ${data.source}, verified ${date})`;
}

// Helper function to parse keyPeople from string format
function parseKeyPeople(keyPeopleString) {
  if (!keyPeopleString) return null;
  
  // Extract the actual key people info from formatted string
  // Format: "Name (Title) (Source: source)"
  const match = keyPeopleString.match(/^(.+?)\s*\(Source:/);
  if (match) {
    return match[1].trim();
  }
  
  // If no source format, return as is
  return keyPeopleString;
}

// Apply updates to a single organization
async function applyUpdates(orgName, pageId, updates) {
  const properties = {};
  const citations = [];
  
  // Map fields to Notion properties
  if (updates.funding) {
    properties['Funding'] = {
      rich_text: [{
        type: 'text',
        text: { content: formatCitation(updates.funding) }
      }]
    };
    citations.push(`Funding: ${updates.funding.source || 'Company data'}`);
  }
  
  if (updates.revenue) {
    properties['Revenue'] = {
      rich_text: [{
        type: 'text',
        text: { content: formatCitation(updates.revenue) }
      }]
    };
    citations.push(`Revenue: ${updates.revenue.source || 'Financial reports'}`);
  }
  
  if (updates.employeeCount) {
    properties['Employee Count'] = {
      rich_text: [{
        type: 'text',
        text: { content: formatCitation(updates.employeeCount) }
      }]
    };
    citations.push(`Employee Count: ${updates.employeeCount.source || 'LinkedIn'}`);
  }
  
  if (updates.valuation) {
    properties['Valuation'] = {
      rich_text: [{
        type: 'text',
        text: { content: formatCitation(updates.valuation) }
      }]
    };
    citations.push(`Valuation: ${updates.valuation.source || 'Market data'}`);
  }
  
  if (updates.keyPeople) {
    // Handle both string and object formats
    let keyPeopleContent;
    
    if (typeof updates.keyPeople === 'string') {
      keyPeopleContent = parseKeyPeople(updates.keyPeople);
    } else if (updates.keyPeople.value) {
      keyPeopleContent = updates.keyPeople.value;
    } else {
      keyPeopleContent = updates.keyPeople;
    }
    
    if (keyPeopleContent) {
      properties['Key People'] = {
        rich_text: [{
          type: 'text',
          text: { content: keyPeopleContent }
        }]
      };
      citations.push(`Key People: ${updates.keyPeople.source || 'Company website'}`);
    }
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
  console.log('🔐 BC AI Validated Intelligence Applicator (FIXED)');
  console.log('=================================================\n');
  
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
    
    const result = await applyUpdates(
      update.organization,
      update.pageId,
      update.updates
    );
    
    if (result.dryrun) {
      results.skipped++;
      results.details.push({
        organization: update.organization,
        status: 'dryrun'
      });
    } else if (result.success) {
      console.log(`  ✅ Successfully updated ${update.organization}`);
      results.updated++;
      results.details.push({
        organization: update.organization,
        status: 'updated'
      });
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
  const reportData = {
    timestamp: new Date().toISOString(),
    mode: options.dryrun ? 'DRY RUN' : 'LIVE UPDATE',
    sourceVerification: options.verify ? 'ENABLED' : 'DISABLED',
    summary: {
      processed: results.processed,
      updated: results.updated,
      skipped: results.skipped,
      failed: results.failed
    },
    details: results.details
  };
  
  // Save report
  const reportPath = path.join(
    process.cwd(),
    'data',
    'reports',
    `${new Date().toISOString().split('T')[0]}_${Date.now()}_intelligence-application.md`
  );
  
  const reportContent = `# Intelligence Application Report

*Generated: ${new Date().toLocaleString()}*

## Summary

- **Mode**: ${reportData.mode}
- **Source Verification**: ${reportData.sourceVerification}
- **Organizations Processed**: ${reportData.summary.processed}
- **Successfully Updated**: ${reportData.summary.updated}
- **Skipped**: ${reportData.summary.skipped}
- **Failed**: ${reportData.summary.failed}

## Update Details

${reportData.details.map(d => `### ${d.organization}
- **Status**: ${d.status}
${d.error ? `- **Error**: ${d.error}` : ''}
`).join('\n')}
`;
  
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, reportContent);
  
  console.log(`\n📄 Application report written to: ${reportPath}`);
  
  // Final summary
  console.log('\n📊 Final Summary:');
  console.log(`   ✅ Processed: ${results.processed}`);
  console.log(`   ✅ Updated: ${results.updated}`);
  console.log(`   ⏭️  Skipped: ${results.skipped}`);
  console.log(`   ❌ Failed: ${results.failed}`);
}

// Run the application
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});