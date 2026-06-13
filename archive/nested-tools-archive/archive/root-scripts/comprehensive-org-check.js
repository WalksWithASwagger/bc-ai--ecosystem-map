const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

const databaseId = process.env.NOTION_DATABASE_ID;

// All organizations from discovery files
const allDiscoveryOrgs = [
  // From discovery-scout.md
  "MATT3R",
  "Indiegraf", 
  "Defang Software Labs",
  "Quandri",
  "Inofuse",
  "Lila Sciences",
  
  // From discovery-scout-expanded.md
  "AI Summit Vancouver 2025",
  "AI Community Conference Vancouver",
  "DevFest YVR AI Summit",
  "Vancouver AI Academy",
  "Van AI Space",
  "Applied AI Research Association",
  "Vancouver AI Community",
  "AI4Good Canada",
  "UBC Centre for Artificial Intelligence Decision-making and Action",
  "SFU AI Research Group",
  "BCIT Applied Artificial Intelligence Program",
  "BC Centre for Innovation and Clean Energy AI Program",
  "Creative Destruction Lab Vancouver",
  "entrepreneurship@UBC Accelerate",
  "Coast Capital Savings Innovation Centre",
  "BC Tech Association Hypergrowth",
  
  // From discovery-scout-regional.md
  "Audette.io",
  "Echosec Systems",
  "Barnacle Systems",
  "Flytographer",
  "UVic AI and Machine Learning Lab",
  "QHR Technologies",
  "FreshGrade",
  "Disney Interactive Studios Kelowna",
  "Yeti Farm Creative",
  "FNHA Digital Health Division",
  "Indigenous Digital Equity Strategy BC",
  "Photonic Inc",
  "Nirvanic Consciousness Technologies",
  "Quantum BC",
  "Quantum Matter Institute",
  "SFU Quantum Fabrication Centre",
  "TRU Computer Science Department",
  "Northern Development Initiative Trust",
  "UNBC Computer Science Department",
  "Tkmlps Development Corporation",
  "AQC 2025 Vancouver"
];

async function checkAllOrganizations() {
  console.log(`\n🔍 Checking ${allDiscoveryOrgs.length} organizations from discovery files...\n`);
  
  const notFound = [];
  const found = [];
  
  for (const orgName of allDiscoveryOrgs) {
    try {
      const response = await notion.databases.query({
        database_id: databaseId,
        filter: {
          property: 'Name',
          title: {
            contains: orgName.replace(/[@]/g, '') // Remove @ symbols for search
          }
        }
      });
      
      if (response.results.length > 0) {
        found.push(orgName);
      } else {
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
  
  // Save results to file
  const results = {
    timestamp: new Date().toISOString(),
    totalChecked: allDiscoveryOrgs.length,
    found: found.length,
    notFound: notFound.length,
    missingOrganizations: notFound
  };
  
  fs.writeFileSync('discovery-org-check-results.json', JSON.stringify(results, null, 2));
  console.log(`\n📄 Results saved to discovery-org-check-results.json`);
}

checkAllOrganizations();