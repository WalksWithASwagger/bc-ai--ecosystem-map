#!/usr/bin/env node
/**
 * Unarchive a specific page in the Notion database
 * Usage: NOTION_TOKEN=... node scripts/unarchive-page.js PAGE_ID
 */
const { Client } = require('@notionhq/client');

if (!process.env.NOTION_TOKEN) {
  console.error('Set NOTION_TOKEN env var');
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function unarchivePage(pageId) {
  try {
    const response = await notion.pages.update({
      page_id: pageId,
      archived: false
    });
    
    console.log(`✅ Successfully unarchived page: ${pageId}`);
    console.log(`Page title: ${response.properties.Name?.title[0]?.plain_text || 'Unknown'}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to unarchive page: ${pageId}`);
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

unarchivePage(pageId).then(success => {
  process.exit(success ? 0 : 1);
}); 