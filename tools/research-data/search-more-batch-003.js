const { Client } = require('@notionhq/client');
const config = require('../config');

const notion = new Client({
  auth: config.NOTION_TOKEN || process.env.NOTION_TOKEN
});

const databaseId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

async function searchMoreVariations() {
  console.log(`\n🔍 Searching for more organizations with variations...\n`);
  
  const searchTerms = [
    { original: 'STEMCELL Technologies', variations: ['STEMCELL', 'Stemcell', 'StemCell'] },
    { original: 'Procurify', variations: ['Procurify'] },
    { original: 'Motive.io', variations: ['Motive', 'MotiveDriven'] },
    { original: 'Appnovation', variations: ['Appnovation'] },
    { original: 'Archiact', variations: ['Archiact'] },
    { original: 'Tasktop', variations: ['Tasktop'] },
    { original: 'Payfirma', variations: ['Payfirma', 'PayFirma'] }
  ];
  
  const results = [];
  
  for (const term of searchTerms) {
    console.log(`Searching for: "${term.original}"`);
    
    for (const variation of term.variations) {
      try {
        const response = await notion.databases.query({
          database_id: databaseId,
          filter: {
            property: 'Name',
            title: {
              contains: variation
            }
          },
          page_size: 10
        });
        
        if (response.results.length > 0) {
          console.log(`  Found matches for "${variation}":`);
          response.results.forEach(page => {
            const title = page.properties.Name.title[0]?.plain_text || 'Unknown';
            const category = page.properties.Category?.select?.name || 'No category';
            console.log(`  ✅ ${title} (${category}) - ID: ${page.id}`);
            
            if (!results.find(r => r.id === page.id)) {
              results.push({ 
                searchedFor: term.original,
                foundAs: title, 
                id: page.id,
                category: category
              });
            }
          });
        }
      } catch (error) {
        console.error(`Error searching:`, error.message);
      }
    }
  }
  
  console.log('\n📋 Found organizations:');
  console.log(JSON.stringify(results, null, 2));
  return results;
}

// Run the search
searchMoreVariations();