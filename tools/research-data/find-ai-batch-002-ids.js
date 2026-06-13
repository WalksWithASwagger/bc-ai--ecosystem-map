const { Client } = require('@notionhq/client');

// Load config
let config = {};
try {
  config = require('../config');
} catch (e) {
  // Use environment variables
}

const notion = new Client({
  auth: config.NOTION_TOKEN || process.env.NOTION_TOKEN
});

const databaseId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

async function findBatch2Ids() {
  console.log(`\n🔍 Finding AI Batch 002 organization IDs...\n`);
  
  const orgsToSearch = [
    'AbCellera',
    'Aspect Biosystems',
    'Terramera',
    'General Fusion',
    'Lumen5',
    'Dapper Labs',
    'Kardium',
    'Traction on Demand',
    'Finger Food Studios',
    'MetaOptima'
  ];
  
  const results = [];
  
  for (const name of orgsToSearch) {
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
      
      if (response.results.length > 0) {
        const page = response.results[0];
        const id = page.id;
        const title = page.properties.Name.title[0]?.plain_text || 'Unknown';
        console.log(`✅ Found "${title}"`);
        console.log(`   ID: ${id}`);
        results.push({ name: title, id: id });
      } else {
        console.log(`❌ NOT FOUND: "${name}"`);
        
        // Try partial match
        const partialResponse = await notion.databases.query({
          database_id: databaseId,
          filter: {
            property: 'Name',
            title: {
              contains: name
            }
          }
        });
        
        if (partialResponse.results.length > 0) {
          console.log(`   Partial matches found:`);
          partialResponse.results.slice(0, 3).forEach(page => {
            const title = page.properties.Name.title[0]?.plain_text || 'Unknown';
            console.log(`   - ${title} (ID: ${page.id})`);
          });
        }
      }
    } catch (error) {
      console.error(`Error searching for ${name}:`, error.message);
    }
  }
  
  console.log('\n📋 Summary:');
  console.log(JSON.stringify(results, null, 2));
  console.log(`\n✅ Found ${results.length} out of ${orgsToSearch.length} organizations`);
  return results;
}

// Run the search
findBatch2Ids();