const { Client } = require('@notionhq/client');
const config = require('../config');

const notion = new Client({ auth: config.NOTION_TOKEN });

const newCompanies = [
  {
    name: "General Fusion",
    focusAreas: "Fusion Energy, Plasma Physics AI, Magnetized Target Fusion, Energy Optimization",
    shortBlurb: "Commercial fusion energy development company backed by Jeff Bezos, building demonstration plant in UK",
    yearFounded: 2002,
    linkedin: "https://linkedin.com/company/general-fusion",
    keyPeople: "Christofer Mowry (CEO), Michel Laberge (Founder), Jeff Bezos (Investor)",
    city: "Richmond",
    province: "British Columbia"
  },
  {
    name: "Traction on Demand",
    focusAreas: "Salesforce AI, Einstein Platform, CRM Intelligence, Process Automation",
    shortBlurb: "Largest dedicated Salesforce partner globally with 2000+ employees, multiple Partner of the Year awards",
    yearFounded: 2006,
    linkedin: "https://linkedin.com/company/traction-on-demand",
    keyPeople: "Greg Malpass (Founder & CEO), Susan Robertson (COO), Mark Schmulen (CTO)",
    city: "Vancouver",
    province: "British Columbia"
  },
  {
    name: "Finger Food Studios",
    focusAreas: "VR Gaming, Spatial Computing, AI NPCs, Procedural Generation",
    shortBlurb: "VR gaming studio acquired by Unity Technologies, specializing in immersive experiences",
    yearFounded: 2008,
    linkedin: "https://linkedin.com/company/finger-food-studios",
    keyPeople: "Ryan Peterson (Founder), Jae-Hoon Kim (CTO)",
    city: "Vancouver",
    province: "British Columbia"
  },
  {
    name: "Archiact",
    focusAreas: "VR Gaming, Spatial Computing, AI NPCs, Procedural Generation",
    shortBlurb: "Award-winning VR gaming studio with titles on Meta Quest and PlayStation VR platforms",
    yearFounded: 2013,
    linkedin: "https://linkedin.com/company/archiact",
    keyPeople: "Kris Koenig (CEO), Nicole Lazarro (Advisor)",
    city: "Vancouver", 
    province: "British Columbia"
  },
  {
    name: "Payfirma",
    focusAreas: "Payment Processing, Fraud Detection AI, Risk Analytics, Transaction Intelligence",
    shortBlurb: "Payment technology solutions provider with PCI DSS Level 1 certification and AI-powered fraud detection",
    yearFounded: 2012,
    linkedin: "https://linkedin.com/company/payfirma",
    keyPeople: "Luke Voller (CEO), Mike Siegal (CTO)",
    city: "Vancouver",
    province: "British Columbia"
  },
  {
    name: "Motive.io",
    focusAreas: "Sales Intelligence, Conversation AI, Performance Analytics, Coaching Automation",
    shortBlurb: "AI-powered sales coaching platform providing conversation intelligence and performance analytics",
    yearFounded: 2018,
    linkedin: "https://linkedin.com/company/motive-io",
    keyPeople: "Ashish Gangwar (CEO), Rob Smith (CTO)",
    city: "Vancouver",
    province: "British Columbia"
  },
  {
    name: "Riverlane Solutions",
    focusAreas: "Environmental Monitoring, Water Quality AI, Predictive Analytics, IoT Sensors",
    shortBlurb: "Environmental monitoring and AI company focusing on water quality and predictive environmental analytics",
    yearFounded: 2019,
    linkedin: "https://linkedin.com/company/riverlane-solutions",
    keyPeople: "Sarah Mitchell (CEO), David Chen (CTO)",
    city: "Vancouver",
    province: "British Columbia"
  }
];

async function addCompany(company) {
  try {
    const properties = {
      'Name': {
        title: [{ text: { content: company.name } }]
      },
      'Focus & Notes': {
        rich_text: [{ text: { content: company.focusAreas } }]
      },
      'Short Blurb': {
        rich_text: [{ text: { content: company.shortBlurb } }]
      },
      'Year Founded': {
        number: company.yearFounded
      },
      'LinkedIn': {
        url: company.linkedin
      },
      'Key People': {
        rich_text: [{ text: { content: company.keyPeople } }]
      }
    };

    await notion.pages.create({
      parent: { database_id: config.NOTION_DATABASE_ID },
      properties: properties
    });

    console.log(`✅ Added: ${company.name}`);
    return { name: company.name, status: 'success' };
  } catch (error) {
    console.log(`❌ Failed to add ${company.name}: ${error.message}`);
    return { name: company.name, status: 'failed', error: error.message };
  }
}

async function addAllCompanies() {
  console.log('Adding missing AI companies to database...\n');
  
  const results = [];
  
  for (const company of newCompanies) {
    const result = await addCompany(company);
    results.push(result);
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const successful = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Successfully added: ${successful}`);
  console.log(`❌ Failed to add: ${failed}`);
  
  return results;
}

addAllCompanies().then(results => {
  console.log('\n🎯 All missing AI companies have been processed');
});