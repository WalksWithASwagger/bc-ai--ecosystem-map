require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const databaseId = process.env.NOTION_DATABASE_ID || '1f0c6f79-9a33-81bd-8332-ca0235c24655';

// Read CSV file
function readCSV() {
  const csvPath = path.join(__dirname, '../imports/url-import-ready.csv');
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  
  const data = [];
  for (let i = 1; i < lines.length; i++) { // Skip header
    // Parse CSV handling quoted values
    const match = lines[i].match(/"([^"]+)","([^"]+)"/);
    if (match) {
      data.push({
        name: match[1],
        url: match[2]
      });
    }
  }
  
  return data;
}

// Find organization by name
async function findOrganizationByName(name) {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Name',
        title: {
          equals: name
        }
      }
    });
    
    return response.results.length > 0 ? response.results[0] : null;
  } catch (error) {
    console.error(`Error finding "${name}":`, error.message);
    return null;
  }
}

// Update organization URL
async function updateOrganizationUrl(pageId, url) {
  try {
    await notion.pages.update({
      page_id: pageId,
      properties: {
        'Website': {
          url: url
        }
      }
    });
    return true;
  } catch (error) {
    console.error('Update error:', error.message);
    return false;
  }
}

// Main update function
async function main() {
  console.log('🚀 Starting URL import process...\n');
  
  const data = readCSV();
  console.log(`📊 Found ${data.length} organizations to update\n`);
  
  const results = {
    success: [],
    notFound: [],
    failed: [],
    skipped: []
  };
  
  let processed = 0;
  
  for (const { name, url } of data) {
    processed++;
    process.stdout.write(`[${processed}/${data.length}] ${name}... `);
    
    // Find organization
    const org = await findOrganizationByName(name);
    
    if (!org) {
      console.log('❌ Not found');
      results.notFound.push(name);
      continue;
    }
    
    // Check if already has URL
    const existingUrl = org.properties.Website?.url;
    if (existingUrl) {
      console.log(`⏭️  Skipped (has: ${existingUrl})`);
      results.skipped.push({ name, existingUrl });
      continue;
    }
    
    // Update URL
    const success = await updateOrganizationUrl(org.id, url);
    if (success) {
      console.log('✅ Updated');
      results.success.push({ name, url });
    } else {
      console.log('❌ Failed');
      results.failed.push(name);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 FINAL SUMMARY:');
  console.log('='.repeat(50));
  console.log(`✅ Successfully updated: ${results.success.length}`);
  console.log(`❌ Not found: ${results.notFound.length}`);
  console.log(`⏭️  Skipped (already has URL): ${results.skipped.length}`);
  console.log(`❌ Failed to update: ${results.failed.length}`);
  
  // Details
  if (results.success.length > 0) {
    console.log('\n✅ Successfully updated:');
    results.success.forEach(({ name, url }) => {
      console.log(`   ${name} → ${url}`);
    });
  }
  
  if (results.notFound.length > 0) {
    console.log('\n❌ Not found in database:');
    results.notFound.forEach(name => console.log(`   ${name}`));
  }
  
  // Save report
  const reportPath = path.join(__dirname, '../imports/url-update-final-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Full report saved to: ${reportPath}`);
}

// Run the import
main().catch(console.error);