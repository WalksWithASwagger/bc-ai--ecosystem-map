#!/usr/bin/env node
/**
 * Check what fields actually exist in the Notion database
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

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Checking database schema...\n');
    
    // Get database info
    const database = await notion.databases.retrieve({ database_id: dbId });
    
    console.log(`Database: ${database.title[0]?.plain_text || 'Untitled'}\n`);
    console.log('Available Properties:\n');
    
    // List all properties
    const properties = Object.entries(database.properties).sort((a, b) => a[0].localeCompare(b[0]));
    
    properties.forEach(([name, prop]) => {
      console.log(`- ${name} (${prop.type})`);
      if (prop.type === 'select' && prop.select?.options) {
        console.log(`  Options: ${prop.select.options.map(o => o.name).join(', ')}`);
      }
    });
    
    // Check specifically for funding-related fields
    console.log('\n🔍 Funding-related fields:');
    const fundingFields = properties.filter(([name]) => 
      name.toLowerCase().includes('fund') || 
      name.toLowerCase().includes('invest') ||
      name.toLowerCase().includes('financ')
    );
    
    if (fundingFields.length > 0) {
      fundingFields.forEach(([name, prop]) => {
        console.log(`- ${name} (${prop.type})`);
      });
    } else {
      console.log('No funding-related fields found!');
    }
    
    // Get a sample page to see actual data
    console.log('\n📄 Fetching sample organization...');
    const response = await notion.databases.query({
      database_id: dbId,
      page_size: 1,
      filter: {
        property: 'Name',
        title: { contains: 'Pano AI' }
      }
    });
    
    if (response.results.length > 0) {
      const page = response.results[0];
      console.log(`\nSample: ${page.properties.Name.title[0]?.plain_text}`);
      console.log('Properties with values:');
      
      Object.entries(page.properties).forEach(([name, prop]) => {
        let value = 'empty';
        if (prop.type === 'title' && prop.title.length > 0) {
          value = prop.title[0].plain_text;
        } else if (prop.type === 'rich_text' && prop.rich_text.length > 0) {
          value = prop.rich_text[0].plain_text;
        } else if (prop.type === 'url' && prop.url) {
          value = prop.url;
        } else if (prop.type === 'number' && prop.number !== null) {
          value = prop.number;
        } else if (prop.type === 'select' && prop.select) {
          value = prop.select.name;
        }
        
        if (value !== 'empty') {
          console.log(`- ${name}: ${value}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.body) {
      console.error('Details:', JSON.stringify(error.body, null, 2));
    }
  }
}

checkDatabaseSchema();