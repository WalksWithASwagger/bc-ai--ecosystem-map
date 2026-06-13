#!/usr/bin/env node
/**
 * Add Funding field to the Notion database
 * This will add a rich_text field for storing funding information
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

async function addFundingField() {
  try {
    console.log('🔧 Adding Funding field to database...\n');
    
    // Update database schema
    const response = await notion.databases.update({
      database_id: dbId,
      properties: {
        'Funding': {
          rich_text: {}
        }
      }
    });
    
    console.log('✅ Successfully added Funding field!');
    console.log('\nField details:');
    console.log('- Name: Funding');
    console.log('- Type: Rich Text');
    console.log('- Description: Store funding rounds, amounts, investors, and dates');
    console.log('\nExample format:');
    console.log('$20M Series A (September 2022) - Lead: Valor Equity Partners');
    console.log('Source: https://www.crunchbase.com/organization/example');
    
  } catch (error) {
    console.error('❌ Error adding field:', error.message);
    
    if (error.code === 'validation_error') {
      console.log('\n💡 Possible reasons:');
      console.log('- Field might already exist');
      console.log('- Insufficient permissions');
      console.log('- Database is locked');
    }
    
    if (error.body) {
      console.error('\nDetails:', JSON.stringify(error.body, null, 2));
    }
  }
}

// Also add other useful fields while we're at it
async function addAdditionalFields() {
  console.log('\n🔧 Checking for other useful fields to add...\n');
  
  const fieldsToAdd = [
    {
      name: 'Revenue',
      type: 'rich_text',
      description: 'Annual revenue, ARR, or revenue estimates'
    },
    {
      name: 'Valuation',
      type: 'rich_text', 
      description: 'Company valuation from funding rounds'
    },
    {
      name: 'Employee Count',
      type: 'rich_text',
      description: 'Current employee count with date'
    },
    {
      name: 'Data Sources',
      type: 'rich_text',
      description: 'Citations and sources for all data'
    },
    {
      name: 'Last Verified',
      type: 'date',
      description: 'Date when data was last verified'
    }
  ];
  
  for (const field of fieldsToAdd) {
    try {
      console.log(`Adding ${field.name}...`);
      
      const properties = {};
      if (field.type === 'rich_text') {
        properties[field.name] = { rich_text: {} };
      } else if (field.type === 'date') {
        properties[field.name] = { date: {} };
      }
      
      await notion.databases.update({
        database_id: dbId,
        properties: properties
      });
      
      console.log(`✅ Added ${field.name} (${field.type})`);
      
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`⏭️  ${field.name} already exists`);
      } else {
        console.log(`❌ Failed to add ${field.name}: ${error.message}`);
      }
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function main() {
  console.log('🚀 BC AI Database Field Enhancement\n');
  
  // First add the Funding field
  await addFundingField();
  
  // Ask if we should add other fields
  console.log('\n❓ Would you like to add additional intelligence fields?');
  console.log('   (Revenue, Valuation, Employee Count, etc.)');
  console.log('\n   Run with --all flag to add all recommended fields');
  
  if (process.argv.includes('--all')) {
    await addAdditionalFields();
  }
  
  console.log('\n✨ Done!');
  console.log('\nNext steps:');
  console.log('1. Re-run the intelligence updates to populate the new Funding field');
  console.log('2. Use the manual entry tool to add funding data');
  console.log('3. Update the database schema documentation');
}

main();