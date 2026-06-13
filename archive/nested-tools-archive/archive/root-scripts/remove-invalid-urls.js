#!/usr/bin/env node
/**
 * Remove invalid URLs identified in the database quality audit
 * These are URLs that return errors (404, timeout, certificate errors, etc.)
 * Usage: node remove-invalid-urls.js [--dry-run]
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

// Parse arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

// Get Notion credentials
const notionToken = config.NOTION_TOKEN || process.env.NOTION_TOKEN;
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

if (!notionToken || !dbId) {
  console.error('Notion token and database ID are required.');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });

// Load the audit results
const auditPath = path.join(__dirname, 'reports', '2025-07-30_database-quality-audit.json');
if (!fs.existsSync(auditPath)) {
  console.error('Audit file not found. Run validate-database-quality.js first.');
  process.exit(1);
}

const auditData = JSON.parse(fs.readFileSync(auditPath, 'utf8'));

async function removeInvalidUrls() {
  console.log('🔍 Removing invalid URLs identified in audit...\n');
  
  if (dryRun) {
    console.log('🔒 DRY RUN MODE - No changes will be made\n');
  }
  
  const results = {
    websitesRemoved: 0,
    totalRemoved: 0,
    errors: []
  };
  
  // Process each invalid URL from the audit
  console.log(`Processing ${auditData.invalidUrls.length} invalid URLs...\n`);
  
  // Group by error type for summary
  const errorTypes = {};
  auditData.invalidUrls.forEach(item => {
    if (!errorTypes[item.error]) {
      errorTypes[item.error] = [];
    }
    errorTypes[item.error].push(item);
  });
  
  // Display summary by error type
  console.log('Invalid URLs by error type:');
  Object.entries(errorTypes).forEach(([error, items]) => {
    console.log(`\n${error} (${items.length} URLs):`);
    items.forEach(item => {
      console.log(`   - ${item.name}`);
    });
  });
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Process each invalid URL
  for (const item of auditData.invalidUrls) {
    console.log(`❌ ${item.name}: ${item.url}`);
    console.log(`   Error: ${item.error}`);
    
    if (!dryRun) {
      try {
        const update = {};
        
        if (item.type === 'website') {
          update.Website = { url: null };
          results.websitesRemoved++;
        }
        
        await notion.pages.update({
          page_id: item.pageId,
          properties: update
        });
        
        console.log(`   ✅ Removed invalid ${item.type} URL`);
        results.totalRemoved++;
        
      } catch (error) {
        console.error(`   ❌ Update error: ${error.message}`);
        results.errors.push({ name: item.name, error: error.message });
      }
    } else {
      console.log(`   [DRY RUN] Would remove invalid ${item.type} URL`);
      results.websitesRemoved++;
      results.totalRemoved++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   Total invalid URLs removed: ${results.totalRemoved}`);
  console.log(`   Errors during removal: ${results.errors.length}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors during removal:');
    results.errors.forEach(err => {
      console.log(`   - ${err.name}: ${err.error}`);
    });
  }
  
  // Generate report
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(__dirname, 'reports', `${timestamp}_invalid-urls-removed.md`);
  
  let report = `# Invalid URLs Removal Report

*Generated on ${new Date().toLocaleString()}*
*Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}*

## Summary

- **Total Invalid URLs**: ${auditData.invalidUrls.length}
- **URLs Removed**: ${results.totalRemoved}
- **Errors During Removal**: ${results.errors.length}

## Invalid URLs by Error Type

`;

  Object.entries(errorTypes).forEach(([error, items]) => {
    report += `### ${error} (${items.length} URLs)\n\n`;
    items.forEach(item => {
      report += `- **${item.name}**: \`${item.url}\` [View](https://www.notion.so/${item.pageId})\n`;
    });
    report += '\n';
  });

  if (results.errors.length > 0) {
    report += `## Errors During Removal\n\n`;
    results.errors.forEach(err => {
      report += `- **${err.name}**: ${err.error}\n`;
    });
  }

  report += `
## Next Steps

1. Research and find correct URLs for these organizations
2. Some organizations may have shut down or changed domains
3. Use the contact enhancement tools to find new websites
4. Consider marking defunct organizations as inactive
`;

  // Ensure reports directory exists
  if (!fs.existsSync(path.dirname(reportPath))) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  }

  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Report written to: ${reportPath}`);
  
  if (dryRun) {
    console.log('\n💡 To remove these invalid URLs for real, run without --dry-run flag');
  } else {
    console.log('\n✅ Invalid URLs have been removed from the database');
  }
}

// Run the script
removeInvalidUrls().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});