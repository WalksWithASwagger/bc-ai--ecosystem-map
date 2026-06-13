#!/usr/bin/env node
/**
 * Resolve ALL duplicate organizations by merging data and removing duplicates
 * This script processes all duplicates without requiring confirmation
 * Usage: node resolve-all-duplicates.js [--dry-run]
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

// Load the duplicate resolution plan
const planPath = path.join(__dirname, 'reports', '2025-07-30_duplicate-resolution.json');
if (!fs.existsSync(planPath)) {
  console.error('Duplicate resolution plan not found. Run validate-database-quality.js first.');
  process.exit(1);
}

const resolutionPlan = JSON.parse(fs.readFileSync(planPath, 'utf8'));

// Convert a value to the appropriate Notion property format
function formatPropertyValue(field, value) {
  switch (field) {
    case 'Name':
      return { title: [{ text: { content: value } }] };
    case 'Website':
    case 'LinkedIn':
      return { url: value };
    case 'Email':
      return { email: value };
    case 'Phone':
      return { phone_number: value };
    case 'City/Region':
    case 'Short Blurb':
    case 'Key People':
      return { rich_text: [{ text: { content: value } }] };
    case 'BC Region':
    case 'Category':
    case 'Size':
      return { select: { name: value } };
    case 'AI Focus Areas':
      return { multi_select: Array.isArray(value) ? value.map(v => ({ name: v })) : [{ name: value }] };
    case 'Year Founded':
    case 'Latitude':
    case 'Longitude':
      return { number: Number(value) };
    default:
      return null;
  }
}

async function resolveDuplicates() {
  console.log('🔄 Resolving ALL duplicate organizations...\n');
  
  if (dryRun) {
    console.log('🔒 DRY RUN MODE - No changes will be made\n');
  }
  
  const results = {
    merged: 0,
    deleted: 0,
    errors: []
  };
  
  console.log(`Processing ${resolutionPlan.duplicatePairs.length} duplicate pairs...\n`);
  
  for (const pair of resolutionPlan.duplicatePairs) {
    console.log(`\n📋 Processing duplicate pair:`);
    console.log(`   Keeper: ${pair.keeper.name}`);
    console.log(`   Duplicate: ${pair.duplicate.name}`);
    
    if (!dryRun) {
      try {
        // First, merge any fields from duplicate to keeper
        if (pair.fieldsToMerge.length > 0) {
          console.log(`   📝 Merging ${pair.fieldsToMerge.length} fields...`);
          
          // Build the update object
          const updates = {};
          
          for (const field of pair.fieldsToMerge) {
            console.log(`      - ${field.field}: ${field.action}`);
            
            const formattedValue = formatPropertyValue(field.field, field.value);
            if (formattedValue) {
              updates[field.field] = formattedValue;
            }
          }
          
          // Update the keeper with merged data
          if (Object.keys(updates).length > 0) {
            await notion.pages.update({
              page_id: pair.keeper.id,
              properties: updates
            });
            
            console.log(`   ✅ Merged data to keeper`);
            results.merged++;
          }
        }
        
        // Then, archive the duplicate
        console.log(`   🗑️  Archiving duplicate...`);
        await notion.pages.update({
          page_id: pair.duplicate.id,
          archived: true
        });
        
        console.log(`   ✅ Archived duplicate`);
        results.deleted++;
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        results.errors.push({ 
          keeper: pair.keeper.name, 
          duplicate: pair.duplicate.name, 
          error: error.message 
        });
      }
    } else {
      console.log(`   [DRY RUN] Would merge ${pair.fieldsToMerge.length} fields and archive duplicate`);
      if (pair.fieldsToMerge.length > 0) results.merged++;
      results.deleted++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`   Duplicate pairs processed: ${resolutionPlan.duplicatePairs.length}`);
  console.log(`   Organizations with merged data: ${results.merged}`);
  console.log(`   Duplicates archived: ${results.deleted}`);
  console.log(`   Errors: ${results.errors.length}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(err => {
      console.log(`   - ${err.keeper} / ${err.duplicate}: ${err.error}`);
    });
  }
  
  // Generate report
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(__dirname, 'reports', `${timestamp}_duplicates-resolved.md`);
  
  let report = `# Duplicate Resolution Report

*Generated on ${new Date().toLocaleString()}*
*Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}*

## Summary

- **Total Duplicate Pairs**: ${resolutionPlan.duplicatePairs.length}
- **Organizations with Merged Data**: ${results.merged}
- **Duplicates Archived**: ${results.deleted}
- **Errors**: ${results.errors.length}

## Resolved Duplicates

`;

  for (const pair of resolutionPlan.duplicatePairs) {
    report += `### ${pair.keeper.name}\n`;
    report += `- **Kept**: ${pair.keeper.name} ([View](https://www.notion.so/${pair.keeper.id}))\n`;
    report += `- **Archived**: ${pair.duplicate.name} ([View](https://www.notion.so/${pair.duplicate.id}))\n`;
    if (pair.fieldsToMerge.length > 0) {
      report += `- **Fields Merged**: ${pair.fieldsToMerge.map(f => f.field).join(', ')}\n`;
    }
    report += '\n';
  }

  if (results.errors.length > 0) {
    report += `## Errors\n\n`;
    results.errors.forEach(err => {
      report += `- **${err.keeper} / ${err.duplicate}**: ${err.error}\n`;
    });
  }

  report += `
## Next Steps

1. Review the archived organizations in Notion
2. Check that merged data is correct
3. Update any references to the archived organizations
4. Consider permanently deleting archived entries after verification
`;

  // Ensure reports directory exists
  if (!fs.existsSync(path.dirname(reportPath))) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  }

  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Report written to: ${reportPath}`);
  
  if (dryRun) {
    console.log('\n💡 To resolve these duplicates for real, run without --dry-run flag');
  } else {
    console.log('\n✅ Duplicates have been resolved');
  }
}

// Run the script
resolveDuplicates().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});