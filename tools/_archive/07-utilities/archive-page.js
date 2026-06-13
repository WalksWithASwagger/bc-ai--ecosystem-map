#!/usr/bin/env node
/**
 * Archive a specific page in the Notion database
 * Usage: NOTION_TOKEN=... NOTION_DATABASE_ID=... node scripts/archive-page.js PAGE_ID
 */
const { Client } = require('@notionhq/client');

if (!process.env.NOTION_TOKEN) {
  console.error('Set NOTION_TOKEN env var');
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function archivePage(pageId) {
  try {
    const response = await notion.pages.update({
      page_id: pageId,
      archived: true
    });
    
    console.log(`✅ Successfully archived page: ${pageId}`);
    console.log(`Page title: ${response.properties.Name?.title[0]?.plain_text || 'Unknown'}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to archive page: ${pageId}`);
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

archivePage(pageId).then(success => {
  process.exit(success ? 0 : 1);
}); 