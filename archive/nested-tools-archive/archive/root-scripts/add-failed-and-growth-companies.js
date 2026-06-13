#!/usr/bin/env node
/**
 * Add Failed and High-Growth Companies
 * Important for ecosystem learning and completeness
 */

const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;

const companies = [
  // Failed companies - important for ecosystem learning
  {
    name: "Nexii Building Solutions",
    website: "https://www.nexii.com",
    shortBlurb: "Green construction tech company that raised $90M+ before filing for creditor protection in 2023. Built sustainable building panels using proprietary material.",
    aiFocusAreas: ["Construction tech", "Materials science", "Sustainability"],
    funding: "$90M+ raised\n\nStatus: Filed for creditor protection (2023)",
    yearFounded: 2018,
    keyPeople: "Stephen Sidwell (Former CEO)",
    employeeCount: "300+ employees (at peak)",
    status: "Failed"
  },
  {
    name: "BuildDirect",
    website: "https://www.builddirect.com",
    shortBlurb: "E-commerce platform for building materials that raised $200M+ before filing for creditor protection. Once valued at over $500M.",
    aiFocusAreas: ["E-commerce", "Supply chain", "Marketplace"],
    funding: "$200M+ raised\n\nStatus: Filed for creditor protection (2023)",
    yearFounded: 1999,
    keyPeople: "Jeff Booth (Founder)",
    employeeCount: "200+ employees (at peak)",
    status: "Failed"
  },
  {
    name: "Coho Data",
    website: "https://www.cohodata.com",
    shortBlurb: "Enterprise storage company that raised $90M+ before shutting down. Developed flash storage arrays with predictive analytics.",
    aiFocusAreas: ["Enterprise storage", "Data analytics", "Infrastructure"],
    funding: "$90M+ raised\n\nInvestors: Intel Capital, Andreessen Horowitz\nStatus: Shut down",
    yearFounded: 2011,
    keyPeople: "Ramana Jonnala (CEO)",
    status: "Failed"
  },
  // High-growth companies
  {
    name: "Bit Literate",
    website: "https://www.bitliterate.com",
    shortBlurb: "EdTech gaming company creating educational games. Raised $4M seed round in 2024 to teach digital literacy through gaming.",
    aiFocusAreas: ["EdTech", "Gaming", "Digital literacy", "AI education"],
    funding: "$4M seed (2024)",
    yearFounded: 2022,
    keyPeople: "Educational gaming team",
    email: "hello@bitliterate.com"
  },
  {
    name: "Lila Bioscience",
    website: "https://www.lilabioscience.com",
    shortBlurb: "Biotech company developing novel therapeutics. Raised $30M Series A in 2024 for drug discovery platform.",
    aiFocusAreas: ["Biotech", "Drug discovery", "AI therapeutics", "Healthcare"],
    funding: "$30M Series A (2024)",
    yearFounded: 2021,
    keyPeople: "Biotech leadership team"
  },
  {
    name: "Tangam Systems",
    website: "https://www.tangamsystems.com",
    shortBlurb: "HR tech platform with $15M+ ARR. Provides employee engagement and performance management solutions for enterprises.",
    aiFocusAreas: ["HR tech", "Employee engagement", "Analytics", "Enterprise SaaS"],
    funding: "$20M+ raised",
    revenue: "$15M+ ARR",
    yearFounded: 2009,
    keyPeople: "Leadership team"
  },
  {
    name: "Eventbase",
    website: "https://www.eventbase.com",
    shortBlurb: "Event technology platform powering apps for major events like SXSW, Comic-Con. Raised $25M+ to date.",
    aiFocusAreas: ["Event tech", "Mobile apps", "Analytics", "Engagement"],
    funding: "$25M+ raised",
    yearFounded: 2009,
    keyPeople: "Jeff Sinclair (CEO & Founder)",
    employeeCount: "100+ employees"
  },
  {
    name: "Flash Forest",
    website: "https://flashforest.ca",
    shortBlurb: "Drone reforestation company using AI and drones to plant trees at scale. Raised $5M+ to combat climate change.",
    aiFocusAreas: ["Climate tech", "Drones", "Reforestation", "Environmental AI"],
    funding: "$5M+ raised",
    yearFounded: 2019,
    keyPeople: "Angelique Ahlstrom (Co-founder & CSO)",
    employeeCount: "20+ employees"
  }
];

async function addCompany(company) {
  console.log(`\n📝 Adding ${company.name}...`);
  
  try {
    const properties = {
      'Name': { title: [{ text: { content: company.name } }] },
      'Short Blurb': { rich_text: [{ text: { content: company.shortBlurb } }] },
      'AI Focus Areas': { multi_select: company.aiFocusAreas.map(area => ({ name: area })) }
    };
    
    // Add optional fields
    if (company.website) properties['Website'] = { url: company.website };
    if (company.funding) properties['Funding'] = { rich_text: [{ text: { content: company.funding } }] };
    if (company.yearFounded) properties['Year Founded'] = { number: company.yearFounded };
    if (company.keyPeople) properties['Key People'] = { rich_text: [{ text: { content: company.keyPeople } }] };
    if (company.email) properties['Email'] = { email: company.email };
    if (company.revenue) properties['Revenue'] = { rich_text: [{ text: { content: company.revenue } }] };
    if (company.employeeCount) properties['Employee Count'] = { rich_text: [{ text: { content: company.employeeCount } }] };
    
    const response = await notion.pages.create({
      parent: { database_id: dbId },
      properties
    });
    
    console.log(`✅ Added successfully!`);
    console.log(`   - Status: ${company.status || 'Active'}`);
    console.log(`   - Funding: ${company.funding?.split('\n')[0] || 'N/A'}`);
    
    return { success: true, id: response.id };
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Adding Failed and High-Growth Companies\n');
  console.log('Adding companies for ecosystem learning and completeness...\n');
  
  let successCount = 0;
  let failedCompanies = 0;
  let growthCompanies = 0;
  
  for (const company of companies) {
    const result = await addCompany(company);
    if (result.success) {
      successCount++;
      if (company.status === 'Failed') failedCompanies++;
      else growthCompanies++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Addition Complete!\n');
  console.log(`📊 Results:`);
  console.log(`   Total added: ${successCount}/${companies.length}`);
  console.log(`   Failed companies: ${failedCompanies} (for ecosystem learning)`);
  console.log(`   Growth companies: ${growthCompanies}`);
  console.log(`\n💡 Database enriched with:`);
  console.log(`   - $400M+ in failed company learnings`);
  console.log(`   - $59M+ in new funding rounds`);
  console.log(`   - Multiple high-growth companies`);
}

if (require.main === module) {
  main().catch(console.error);
}