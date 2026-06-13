#!/usr/bin/env node
/**
 * Check the status of a specific page in the Notion database
 * Usage: NOTION_TOKEN=... node scripts/check-page-status.js PAGE_ID
 */
const { Client } = require('@notionhq/client');

if (!process.env.NOTION_TOKEN) {
  console.error('Set NOTION_TOKEN env var');
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function checkPageStatus(pageId) {
  try {
    const response = await notion.pages.retrieve({
      page_id: pageId
    });
    
    console.log(`Page ID: ${pageId}`);
    console.log(`Title: ${response.properties.Name?.title[0]?.plain_text || 'Unknown'}`);
    console.log(`Archived: ${response.archived}`);
    console.log(`Created: ${response.created_time}`);
    console.log(`Last Edited: ${response.last_edited_time}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to retrieve page: ${pageId}`);
    console.error(`Error: ${error.message}`);
    if (error.body) {
      console.error(`API Error: ${JSON.stringify(error.body)}`);
    }
    return false;
  }
}

const pageId = process.argv[2];
if (!pageId) {
  console.error('Specify page ID as argument');
  process.exit(1);
}

checkPageStatus(pageId).then(success => {
  process.exit(success ? 0 : 1);
}); 