#!/usr/bin/env node

/**
 * Check Notion Database Schema
 * Query the actual database properties to fix import issues
 */

const { Client } = require('@notionhq/client');

// Notion credentials
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    console.error("❌ Missing required environment variables: NOTION_TOKEN and NOTION_DATABASE_ID");
    console.error("Please set these environment variables before running this script.");
    process.exit(1);
}
const notion = new Client({ auth: NOTION_TOKEN });

async function checkSchema() {
  try {
    console.log('🔍 Querying Notion database schema...');
    
    const database = await notion.databases.retrieve({
      database_id: NOTION_DATABASE_ID
    });

    console.log('\n📊 Available Properties:');
    console.log('========================');
    
    Object.keys(database.properties).forEach(propertyName => {
      const property = database.properties[propertyName];
      console.log(`- "${propertyName}" (type: ${property.type})`);
    });

    console.log('\n📋 Complete Schema:');
    console.log(JSON.stringify(database.properties, null, 2));

  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  }
}

checkSchema();