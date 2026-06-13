require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const databaseId = process.env.NOTION_DATABASE_ID || '1f0c6f79-9a33-81bd-8332-ca0235c24655';

// Read the CSV file
function readUrlData() {
  const csvPath = path.join(__dirname, '../imports/url-discovery-consolidated-fixed.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  // Skip header and parse data
  const urls = [];
  for (let i = 1; i < lines.length; i++) {
    const [name, url, notes] = lines[i].split(',').map(s => s.trim());
    if (name && url) {
      urls.push({ name, url, notes });
    }
  }
  
  return urls;
}

// Find organization in Notion by name
async function findOrganization(name) {
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
    console.error(`Error finding organization ${name}:`, error.message);
    return null;
  }
}

// Update organization with URL
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
    console.error(`Error updating organization:`, error.message);
    return false;
  }
}

// Main function
async function updateUrls(testMode = false) {
  console.log('🚀 Starting URL update process...\n');
  
  const urlData = readUrlData();
  console.log(`📋 Found ${urlData.length} URLs to process\n`);
  
  // If test mode, only process first 3
  const dataToProcess = testMode ? urlData.slice(0, 3) : urlData;
  
  const results = {
    success: [],
    notFound: [],
    failed: [],
    skipped: []
  };
  
  for (const { name, url, notes } of dataToProcess) {
    process.stdout.write(`Processing ${name}... `);
    
    // Find organization
    const org = await findOrganization(name);
    
    if (!org) {
      console.log('❌ Not found in database');
      results.notFound.push(name);
      continue;
    }
    
    // Check if URL already exists
    const existingUrl = org.properties.Website?.url;
    if (existingUrl) {
      console.log(`⏭️  Skipped (already has URL: ${existingUrl})`);
      results.skipped.push({ name, existingUrl });
      continue;
    }
    
    // Update URL
    const success = await updateOrganizationUrl(org.id, url);
    
    if (success) {
      console.log(`✅ Updated with ${url}`);
      results.success.push({ name, url });
    } else {
      console.log('❌ Failed to update');
      results.failed.push(name);
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Print summary
  console.log('\n📊 Summary:');
  console.log(`✅ Successfully updated: ${results.success.length}`);
  console.log(`❌ Not found in database: ${results.notFound.length}`);
  console.log(`⏭️  Skipped (already has URL): ${results.skipped.length}`);
  console.log(`❌ Failed to update: ${results.failed.length}`);
  
  if (results.notFound.length > 0) {
    console.log('\n🔍 Organizations not found in database:');
    results.notFound.forEach(name => console.log(`  - ${name}`));
  }
  
  if (results.skipped.length > 0) {
    console.log('\n⏭️  Organizations already with URLs:');
    results.skipped.forEach(({ name, existingUrl }) => 
      console.log(`  - ${name}: ${existingUrl}`)
    );
  }
  
  // Save detailed report
  const reportPath = path.join(__dirname, '../imports/url-update-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

// Check if running in test mode
const testMode = process.argv.includes('--test');

// Run the update
updateUrls(testMode).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});