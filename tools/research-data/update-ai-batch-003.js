#!/usr/bin/env node
/**
 * Update AI companies batch 003
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');

// Load config
const config = require('../config');

const notion = new Client({ auth: config.NOTION_TOKEN });
const dbId = config.NOTION_DATABASE_ID;

async function updateBatch3() {
  console.log('🚀 Updating AI companies batch 003...\n');
  
  // Load the formatted updates
  const updates = require('./2025-01-30-ai-batch-003-formatted.json');
  
  console.log(`Found ${updates.length} organizations to update\n`);
  
  const results = {
    success: 0,
    failed: 0,
    details: []
  };
  
  for (const update of updates) {
    try {
      // Get the organization name first
      const page = await notion.pages.retrieve({ page_id: update.id });
      const orgName = page.properties.Name?.title?.[0]?.plain_text || 'Unknown';
      
      console.log(`Updating ${orgName}...`);
      
      // Prepare properties
      const properties = {};
      
      if (update.linkedin) {
        properties['LinkedIn'] = { url: update.linkedin };
      }
      
      if (update.yearFounded) {
        properties['Year Founded'] = { number: update.yearFounded };
      }
      
      if (update.keyPeople) {
        properties['Key People'] = {
          rich_text: [{
            text: { content: update.keyPeople }
          }]
        };
      }
      
      if (update.shortBlurb) {
        properties['Short Blurb'] = {
          rich_text: [{
            text: { content: update.shortBlurb }
          }]
        };
      }
      
      // Update the page
      await notion.pages.update({
        page_id: update.id,
        properties
      });
      
      console.log(`✅ Successfully updated ${orgName}`);
      results.success++;
      results.details.push({
        name: orgName,
        status: 'success',
        fieldsUpdated: Object.keys(properties)
      });
      
    } catch (error) {
      console.error(`❌ Failed to update ID ${update.id}: ${error.message}`);
      results.failed++;
      results.details.push({
        id: update.id,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Update Summary:');
  console.log(`✅ Successful updates: ${results.success}`);
  console.log(`❌ Failed updates: ${results.failed}`);
  
  // Save results
  const timestamp = new Date().toISOString();
  const resultsPath = path.join(__dirname, `ai-batch-003-results-${timestamp.split('T')[0]}.json`);
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Results saved to: ${resultsPath}`);
}

// Run the update
updateBatch3().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});