const { Client } = require('@notionhq/client');
const config = require('../config');

const notion = new Client({
  auth: config.NOTION_TOKEN || process.env.NOTION_TOKEN
});

const databaseId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

async function findBatch3Ids() {
  console.log(`\n🔍 Finding AI Batch 003 organization IDs...\n`);
  
  const orgsToSearch = [
    'Zymeworks',
    'Procurify',
    'Motive.io',
    'Appnovation',
    'Riverlane Solutions',
    'STEMCELL Technologies',
    'Archiact',
    'Boast.AI',
    'Tasktop',
    'Payfirma'
  ];
  
  const results = [];
  
  for (const name of orgsToSearch) {
    try {
      // Try exact match first
      let response = await notion.databases.query({
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
        
        // Try variations
        const variations = [
          name.replace('.io', ''),
          name.replace('.AI', ''),
          name.split(' ')[0], // First word only
          name.replace('STEMCELL', 'Stemcell')
        ];
        
        let found = false;
        for (const variation of variations) {
          if (variation !== name && variation.length > 2) {
            const varResponse = await notion.databases.query({
              database_id: databaseId,
              filter: {
                property: 'Name',
                title: {
                  contains: variation
                }
              },
              page_size: 5
            });
            
            if (varResponse.results.length > 0) {
              console.log(`   Matches for "${variation}":`);
              varResponse.results.forEach(page => {
                const title = page.properties.Name.title[0]?.plain_text || 'Unknown';
                console.log(`   - ${title} (ID: ${page.id})`);
              });
              found = true;
              break;
            }
          }
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
findBatch3Ids();