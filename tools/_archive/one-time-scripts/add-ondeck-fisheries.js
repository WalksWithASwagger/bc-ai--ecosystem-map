#!/usr/bin/env node
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

async function addOnDeck() {
  const props = {
    Name: { title: [{ text: { content: 'OnDeck Fisheries AI' } }] },
    Website: { url: 'https://www.ondeckfisheries.com' },
    Category: { select: { name: 'Start-ups & Scale-ups' } },
    'City/Region': { rich_text: [{ text: { content: 'Vancouver' } }] },
    'BC Region': { select: { name: 'Lower Mainland' } },
    'AI Focus Areas': { 
      multi_select: [
        { name: 'Computer Vision' },
        { name: 'Environmental Monitoring' }
      ] 
    },
    Funding: { rich_text: [{ text: { content: '$1.5M from Ocean Supercluster (Total project $3.5M) (Source: Ocean Supercluster - Verified 2025-07-30)' } }] },
    'Data Sources': { rich_text: [{ text: { content: 'Ocean Supercluster funding announcement October 2023' } }] },
    'Last Verified': { date: { start: new Date().toISOString().split('T')[0] } }
  };

  try {
    const response = await notion.pages.create({
      parent: { database_id: dbId },
      properties: props
    });
    console.log('✅ Successfully added OnDeck Fisheries AI');
    console.log(`   Page ID: ${response.id}`);
  } catch (error) {
    console.error('❌ Error adding organization:', error.message);
  }
}

addOnDeck();