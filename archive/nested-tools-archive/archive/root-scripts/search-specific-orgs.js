const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

const databaseId = process.env.NOTION_DATABASE_ID;

async function searchOrganizations(names) {
  console.log(`\n🔍 Searching for specific organizations...\n`);
  
  for (const name of names) {
    try {
      const response = await notion.databases.query({
        database_id: databaseId,
        filter: {
          property: 'Name',
          title: {
            contains: name
          }
        }
      });
      
      if (response.results.length > 0) {
        console.log(`✅ Found "${name}" - ${response.results.length} result(s)`);
        response.results.forEach(page => {
          const title = page.properties.Name.title[0]?.plain_text || 'Unknown';
          console.log(`   - ${title}`);
        });
      } else {
        console.log(`❌ NOT FOUND: "${name}"`);
      }
    } catch (error) {
      console.error(`Error searching for ${name}:`, error.message);
    }
  }
}

// Organizations to search for
const orgsToSearch = [
  'Quandri',
  'Inofuse',
  'Photonic',
  'Nytilus',
  'SmartParent',
  'Amphoraxe'
];

searchOrganizations(orgsToSearch);