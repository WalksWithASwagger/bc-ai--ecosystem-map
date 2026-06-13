const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

const databaseId = process.env.NOTION_DATABASE_ID;

// Key organizations from the CSV that might not be in the database
const csvOrgs = [
  "Microsoft Vancouver",
  "Google Vancouver", 
  "IBM Vancouver",
  "Meta Vancouver",
  "SAP Canada",
  "Deloitte Omnia AI",
  "Cisco Systems Vancouver",
  "Brightspark Ventures",
  "Pender Ventures",
  "Kensington Capital Partners",
  "Raven Indigenous Capital Partners",
  "Axiom Zen",
  "Finn AI",
  "Unity Technologies Vancouver",
  "Fujitsu",
  "Grammarly",
  "Amplitude Ventures",
  "Graphics Artificial Intelligence Design and Games Lab",
  "Vancouver Angel Network",
  "Spring Activator",
  "VIATEC",
  "Dooly.ai",
  "Picovoice",
  "Victory Square Technologies",
  "Scoop Robotix",
  "MarineLabs",
  "Precision OS",
  "Flutter Care",
  "Fobi AI",
  "Levr.ai",
  "Safety CLI Cybersecurity",
  "VodaSafe",
  "SkyHive",
  "Planview Vancouver",
  "OnDeck Fisheries",
  "ThisFish",
  "WildlifeAI",
  "SparkGeo",
  "Softmax Data",
  "TerraSense Analytics",
  "Spexi"
];

async function checkCSVOrganizations() {
  console.log(`\n🔍 Checking ${csvOrgs.length} organizations from CSV file...\n`);
  
  const notFound = [];
  const found = [];
  
  for (const orgName of csvOrgs) {
    try {
      // Try different search variations
      const searchTerms = [
        orgName,
        orgName.replace(' Vancouver', '').replace(' (Vancouver)', ''),
        orgName.replace('Vancouver ', ''),
        orgName.split(' ')[0] // Just the first word
      ];
      
      let foundMatch = false;
      
      for (const term of searchTerms) {
        const response = await notion.databases.query({
          database_id: databaseId,
          filter: {
            property: 'Name',
            title: {
              contains: term
            }
          }
        });
        
        if (response.results.length > 0) {
          found.push(orgName);
          foundMatch = true;
          break;
        }
      }
      
      if (!foundMatch) {
        notFound.push(orgName);
      }
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error searching for ${orgName}:`, error.message);
    }
  }
  
  console.log(`\n📊 Results:`);
  console.log(`✅ Found in database: ${found.length}`);
  console.log(`❌ NOT in database: ${notFound.length}\n`);
  
  if (notFound.length > 0) {
    console.log(`Organizations NOT in database:`);
    notFound.forEach(org => console.log(`- ${org}`));
  }
}

checkCSVOrganizations();