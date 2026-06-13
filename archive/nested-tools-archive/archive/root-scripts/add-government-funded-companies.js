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

const companies = [
  {
    name: '4AG Robotics',
    website: 'https://www.4ag.ca',
    city: 'Salmon Arm',
    region: 'Interior BC',
    category: 'Start-ups & Scale-ups',
    aiAreas: ['Robotics', 'Computer Vision'],
    funding: 'PacifiCan Business Scale-up Program funding (2025-03)',
    description: 'AI-powered robotic mushroom harvesting technology'
  },
  {
    name: 'Rigid Robotics',
    website: 'https://www.rigidrobotics.com',
    city: 'Burnaby',
    region: 'Lower Mainland',
    category: 'Start-ups & Scale-ups',
    aiAreas: ['Robotics', 'Industrial AI'],
    funding: '$975,000 from PacifiCan Business Scale-up Program (2024-11)',
    description: 'AI-powered cloud platform for mining industry'
  },
  {
    name: 'HealthTech Connex',
    website: 'https://www.healthtechconnex.com',
    city: 'Surrey',
    region: 'Lower Mainland',
    category: 'Start-ups & Scale-ups',
    aiAreas: ['Healthcare AI', 'Medical Imaging'],
    funding: '$3.7M from PacifiCan Business Scale-up Program (2024)',
    description: 'AI-enhanced brain imaging medical device'
  },
  {
    name: 'Ocean AID',
    city: 'Victoria',
    region: 'Vancouver Island',
    category: 'Start-ups & Scale-ups',
    aiAreas: ['Computer Vision', 'Marine Technology'],
    description: 'AI-powered marine decision-making through real-time object detection'
  },
  {
    name: 'Narval Energy Inc.',
    city: 'Vancouver',
    region: 'Lower Mainland',
    category: 'Start-ups & Scale-ups',
    aiAreas: ['Clean Technology'],
    description: 'Extreme-temperature battery technology (UBC spin-off)'
  }
];

async function findExisting(name) {
  try {
    const response = await notion.databases.query({
      database_id: dbId,
      filter: {
        property: 'Name',
        title: { equals: name }
      }
    });
    return response.results.length > 0;
  } catch (error) {
    console.error(`Error checking ${name}:`, error.message);
    return false;
  }
}

async function addCompany(company) {
  const props = {
    Name: { title: [{ text: { content: company.name } }] },
    Category: { select: { name: company.category } },
    'City/Region': { rich_text: [{ text: { content: company.city } }] },
    'BC Region': { select: { name: company.region } },
    'AI Focus Areas': { 
      multi_select: company.aiAreas.map(area => ({ name: area }))
    },
    'Data Sources': { rich_text: [{ text: { content: 'PacifiCan/UBC research July 2025' } }] },
    'Last Verified': { date: { start: new Date().toISOString().split('T')[0] } }
  };

  if (company.website) {
    props['Website'] = { url: company.website };
  }

  if (company.funding) {
    props['Funding'] = { rich_text: [{ text: { content: company.funding } }] };
  }

  try {
    const response = await notion.pages.create({
      parent: { database_id: dbId },
      properties: props
    });
    console.log(`✅ Added ${company.name}`);
    return response.id;
  } catch (error) {
    console.error(`❌ Error adding ${company.name}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Adding Government-Funded AI Companies');
  console.log('=====================================\n');

  let added = 0;
  let skipped = 0;

  for (const company of companies) {
    const exists = await findExisting(company.name);
    
    if (exists) {
      console.log(`⏭️  Skipped ${company.name} (already exists)`);
      skipped++;
    } else {
      const result = await addCompany(company);
      if (result) {
        added++;
      }
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Added: ${added}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📋 Total: ${companies.length}`);
}

main().catch(console.error);