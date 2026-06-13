const { Client } = require('@notionhq/client');

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

const databaseId = process.env.NOTION_DATABASE_ID;

async function findOrganizationIds() {
  console.log(`\n🔍 Finding organization IDs for LinkedIn and Website updates...\n`);
  
  // LinkedIn organizations
  const linkedinOrgs = [
    "1QBit", "AbCellera", "D-Wave Systems", "Klue", "Lumen5", 
    "Two Hat Security", "Certn", "Photonic Inc", "Integrated Roadways",
    "Axiom Zen", "Archiact", "Cymax Group Technologies", "VanHack",
    "Thinkific", "Clio"
  ];
  
  // Website organizations  
  const websiteOrgs = [
    "Dapper Labs", "Kardium", "Felix", "Big Whale Labs", "Leasey.AI",
    "Toonie", "Athennian", "MindfulGarden", "Riipen", "Edvisor.io",
    "Keywords Studios Vancouver"
  ];
  
  const allOrgs = [...new Set([...linkedinOrgs, ...websiteOrgs])];
  const results = [];
  
  for (const name of allOrgs) {
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
        console.log(`✅ Found "${title}" - ID: ${id}`);
        results.push({ name: title, id: id });
      } else {
        console.log(`❌ NOT FOUND: "${name}"`);
      }
    } catch (error) {
      console.error(`Error searching for ${name}:`, error.message);
    }
  }
  
  console.log('\n📋 Found organizations:', results.length);
  return results;
}

findOrganizationIds();