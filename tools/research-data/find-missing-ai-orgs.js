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

async function searchVariations(searchTerms) {
  console.log(`\n🔍 Searching for organizations with variations...\n`);
  
  const results = [];
  
  for (const term of searchTerms) {
    console.log(`\nSearching for: "${term.original}"`);
    
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
          page_size: 5
        });
        
        if (response.results.length > 0) {
          console.log(`  Found matches for "${variation}":`);
          response.results.forEach(page => {
            const title = page.properties.Name.title[0]?.plain_text || 'Unknown';
            console.log(`  ✅ ${title} (ID: ${page.id})`);
            
            // Check if not already in results
            if (!results.find(r => r.id === page.id)) {
              results.push({ 
                searchedFor: term.original,
                foundAs: title, 
                id: page.id 
              });
            }
          });
        }
      } catch (error) {
        console.error(`Error searching:`, error.message);
      }
    }
  }
  
  console.log('\n📋 Results:');
  console.log(JSON.stringify(results, null, 2));
  return results;
}

// Search variations for missing organizations
const searchTerms = [
  {
    original: 'Minerva Intelligence',
    variations: ['Minerva', 'MINERVA', 'Minerva Intel']
  },
  {
    original: 'Trulioo',
    variations: ['Trulioo', 'TRULIOO']
  },
  {
    original: 'Thinkific',
    variations: ['Thinkific', 'THINKIFIC', 'Think']
  },
  {
    original: 'Photonic',
    variations: ['Photonic', 'Photonic Inc', 'PHOTONIC']
  }
];

// Run the search
searchVariations(searchTerms).then(results => {
  console.log(`\n✅ Found ${results.length} organizations`);
});