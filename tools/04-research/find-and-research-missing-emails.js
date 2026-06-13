#!/usr/bin/env node
/**
 * Find 20 organizations with websites but missing email addresses
 * Then research their contact information by visiting their websites
 * Usage: NOTION_TOKEN=... node find-and-research-missing-emails.js
 */
const { Client } = require('@notionhq/client');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

if (!process.env.NOTION_TOKEN) {
  console.error('Set NOTION_TOKEN env var');
  process.exit(1);
}

// Use the working token from test-connection.js
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DATABASE_ID = process.env.AI_COMPANY_DB_ID;

// Helper to safely extract property values
function getPropertyValue(page, propName) {
  const prop = page.properties[propName];
  if (!prop) return null;

  switch (prop.type) {
    case 'title':
    case 'rich_text':
      return prop[prop.type].length > 0 && prop[prop.type][0].plain_text ? prop[prop.type][0].plain_text : null;
    case 'url':
    case 'email':
    case 'phone_number':
      return prop[prop.type] || null;
    case 'number':
      return prop[prop.type];
    case 'date':
      return prop[prop.type] ? prop[prop.type].start : null;
    default:
      return null;
  }
}

async function findOrgsWithWebsitesButNoEmail() {
  console.log('🔍 Searching for organizations with websites but missing email addresses...');
  
  // Fetch all pages from database
  const pages = [];
  let cursor;
  
  do {
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      start_cursor: cursor,
      page_size: 100
    });
    
    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor);
  
  console.log(`📊 Total organizations in database: ${pages.length}`);
  
  // Filter organizations that have websites but no email
  const candidates = pages.filter(page => {
    const website = getPropertyValue(page, 'Website');
    const email = getPropertyValue(page, 'Email');
    
    return website && !email; // Has website but no email
  }).map(page => {
    const name = getPropertyValue(page, 'Name') || 'Unknown Organization';
    const website = getPropertyValue(page, 'Website');
    const phone = getPropertyValue(page, 'Phone');
    const linkedin = getPropertyValue(page, 'LinkedIn');
    const region = getPropertyValue(page, 'BC Region');
    const category = getPropertyValue(page, 'Category');
    const funding = getPropertyValue(page, 'Funding');
    const yearFounded = getPropertyValue(page, 'Year Founded');
    
    return {
      id: page.id,
      name,
      website,
      phone,
      linkedin,
      region,
      category,
      funding,
      yearFounded,
      notionUrl: page.url
    };
  });
  
  console.log(`🎯 Found ${candidates.length} organizations with websites but missing email addresses`);
  
  // Prioritize organizations with funding or founding year data
  const prioritized = candidates.sort((a, b) => {
    // Score based on available data
    const scoreA = (a.funding ? 2 : 0) + (a.yearFounded ? 1 : 0) + (a.phone ? 1 : 0) + (a.linkedin ? 1 : 0);
    const scoreB = (b.funding ? 2 : 0) + (b.yearFounded ? 1 : 0) + (b.phone ? 1 : 0) + (b.linkedin ? 1 : 0);
    return scoreB - scoreA;
  });
  
  // Take top 20
  const top20 = prioritized.slice(0, 20);
  
  console.log('\n📋 Top 20 Priority Organizations for Email Research:');
  console.log('='.repeat(80));
  
  top20.forEach((org, index) => {
    console.log(`${index + 1}. ${org.name}`);
    console.log(`   Website: ${org.website}`);
    console.log(`   Region: ${org.region || 'Unknown'}`);
    console.log(`   Category: ${org.category || 'Unknown'}`);
    if (org.funding) console.log(`   Funding: ${org.funding}`);
    if (org.yearFounded) console.log(`   Founded: ${org.yearFounded}`);
    if (org.phone) console.log(`   Phone: ${org.phone}`);
    if (org.linkedin) console.log(`   LinkedIn: ${org.linkedin}`);
    console.log(`   Notion: ${org.notionUrl}`);
    console.log('');
  });
  
  // Save results for research
  const resultsPath = path.join(__dirname, 'research', `email-research-targets-${new Date().toISOString().split('T')[0]}.json`);
  
  // Ensure research directory exists
  const researchDir = path.join(__dirname, 'research');
  if (!fs.existsSync(researchDir)) {
    fs.mkdirSync(researchDir, { recursive: true });
  }
  
  const resultsData = {
    timestamp: new Date().toISOString(),
    totalCandidates: candidates.length,
    selectedForResearch: top20,
    summary: {
      totalOrgsInDatabase: pages.length,
      orgsWithWebsites: pages.filter(p => getPropertyValue(p, 'Website')).length,
      orgsWithEmails: pages.filter(p => getPropertyValue(p, 'Email')).length,
      orgsWithWebsitesButNoEmail: candidates.length
    }
  };
  
  fs.writeFileSync(resultsPath, JSON.stringify(resultsData, null, 2));
  console.log(`💾 Research targets saved to: ${resultsPath}`);
  
  return top20;
}

// Main execution
async function main() {
  try {
    await findOrgsWithWebsitesButNoEmail();
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Visit each organization\'s website');
    console.log('2. Look for Contact, About, or Team pages');
    console.log('3. Search for emails like info@, hello@, contact@, support@');
    console.log('4. Only collect official company emails (not personal)');
    console.log('5. Run the update script to add found emails to database');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.body) console.error('API Error:', error.body);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { findOrgsWithWebsitesButNoEmail };