#!/usr/bin/env node
/**
 * Remove suspicious URLs identified in the database quality audit
 * This script uses the exact list from the audit report
 * Usage: node remove-audit-suspicious-urls.js [--dry-run]
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

async function removeSuspiciousUrls() {
  console.log('🔍 Removing suspicious URLs identified in audit...\n');
  
  if (dryRun) {
    console.log('🔒 DRY RUN MODE - No changes will be made\n');
  }
  
  const results = {
    websitesRemoved: 0,
    linkedInRemoved: 0,
    totalRemoved: 0,
    errors: []
  };
  
  // Process each suspicious URL from the audit
  console.log(`Processing ${auditData.suspiciousUrls.length} suspicious URLs...\n`);
  
  for (const item of auditData.suspiciousUrls) {
    console.log(`⚠️  ${item.name}: ${item.url} (${item.type})`);
    
    if (!dryRun) {
      try {
        const update = {};
        
        if (item.type === 'website') {
          update.Website = { url: null };
          results.websitesRemoved++;
        } else if (item.type === 'linkedin') {
          update.LinkedIn = { url: null };
          results.linkedInRemoved++;
        }
        
        await notion.pages.update({
          page_id: item.pageId,
          properties: update
        });
        
        console.log(`   ✅ Removed ${item.type} URL`);
        results.totalRemoved++;
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        results.errors.push({ name: item.name, error: error.message });
      }
    } else {
      console.log(`   [DRY RUN] Would remove ${item.type} URL`);
      
      if (item.type === 'website') {
        results.websitesRemoved++;
      } else {
        results.linkedInRemoved++;
      }
      results.totalRemoved++;
    }
  }
  
  // Summary
  console.log('\n📊 Summary:');
  console.log(`   Total URLs removed: ${results.totalRemoved}`);
  console.log(`   Websites: ${results.websitesRemoved}`);
  console.log(`   LinkedIn: ${results.linkedInRemoved}`);
  console.log(`   Errors: ${results.errors.length}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(err => {
      console.log(`   - ${err.name}: ${err.error}`);
    });
  }
  
  if (dryRun) {
    console.log('\n💡 To remove these URLs for real, run without --dry-run flag');
  } else {
    console.log('\n✅ Suspicious URLs have been removed from the database');
  }
}

// Run the script
removeSuspiciousUrls().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});