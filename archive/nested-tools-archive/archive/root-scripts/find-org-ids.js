const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

const databaseId = process.env.NOTION_DATABASE_ID;

async function findOrganizationIds(names) {
  console.log(`\n🔍 Searching for organization IDs...\n`);
  
  const results = [];
  
  for (const name of names) {
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
      }
    } catch (error) {
      console.error(`Error searching for ${name}:`, error.message);
    }
  }
  
  console.log('\n📋 Summary:');
  console.log(JSON.stringify(results, null, 2));
  return results;
}

// Organizations to search for
const orgsToSearch = [
  'InBC Life Sciences Investment Fund',
  'Digital Technology Supercluster Healthtech AI',
  'BC Centre for Innovation and Clean Energy',
  'Microsoft VCH AI Partnership',
  'SFU Digital Health Innovation Lab',
  'Law Society of BC AI Ethics Program',
  'BCSC RegTech Sandbox',
  'Pano AI BC',
  'PacifiCan Regional Artificial Intelligence Initiative'
];

findOrganizationIds(orgsToSearch);