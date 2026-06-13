#!/usr/bin/env node
/**
 * Update More Companies from News Research
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;

const companyUpdates = [
  {
    name: "Moment Energy",
    updates: {
      funding: "$15M USD Series A (January 2025)\n\nCo-led by Amazon Climate Pledge Fund & Voyager Ventures\nOther investors: In-Q-Tel, Version One, Overture, WovenEarth, Fika, MCJ\nTotal raised: $52M USD",
      revenue: "Secured $20.3M USD from US Department of Energy (October 2024)",
      keyPeople: "Sumreen Rattan, Edward Chiang, Gabriel Soares, Gurmesh Sidhu (Co-founders)",
      yearFounded: 2020,
      shortBlurb: "EV battery repurposing company building world's first second-life gigafactory. Offers energy storage 30% cheaper than traditional systems. Raised $15M Series A in Jan 2025.",
      employeeCount: "Planning to create 250+ jobs with US gigafactory"
    }
  },
  {
    name: "Phaidra",
    updates: {
      funding: "$12M Series A (July 2024)\n\nLed by Index Ventures\nTotal raised: $60.5M",
      keyPeople: "Jim Gao (CEO & Co-founder, ex-DeepMind Energy lead)\nVedavyas Panneershelvam (Co-founder, ex-DeepMind)\nKatherine Hoffman (Co-founder)",
      yearFounded: 2019,
      shortBlurb: "AI virtual plant operator for industrial automation. Founded by ex-DeepMind team. Reduces data center energy consumption by up to 30%. $12M Series A in 2024.",
      employeeCount: "100 employees",
      aiFocusAreas: ["Industrial AI", "Energy optimization", "Data center cooling", "Reinforcement learning"],
      location: "Seattle (not Vancouver)"
    }
  },
  {
    name: "Roomvu",
    updates: {
      funding: "Backed by NAR REACH (National Association of Realtors)",
      keyPeople: "Sam Mehrbod (CEO & Co-founder)",
      shortBlurb: "AI-powered real estate marketing platform generating hyperlocal video content. Serves 95,000+ agents. CIX 2024 Top 20 Early Award winner. Expanded to US in 2024.",
      aiFocusAreas: ["Real estate AI", "Content generation", "Marketing automation", "Proptech"],
      yearFounded: 2016
    }
  }
];

async function updateCompany(companyData) {
  console.log(`\n📝 Updating ${companyData.name}...`);
  
  try {
    const response = await notion.databases.query({
      database_id: dbId,
      filter: {
        property: 'Name',
        title: { contains: companyData.name }
      }
    });
    
    if (response.results.length === 0) {
      console.log(`   ⚠️  Company not found in database`);
      return { success: false, error: 'Not found' };
    }
    
    const page = response.results[0];
    const properties = {};
    
    // Build updates
    if (companyData.updates.revenue) {
      properties['Revenue'] = { rich_text: [{ text: { content: companyData.updates.revenue } }] };
    }
    
    if (companyData.updates.funding) {
      properties['Funding'] = { rich_text: [{ text: { content: companyData.updates.funding } }] };
    }
    
    if (companyData.updates.employeeCount) {
      properties['Employee Count'] = { rich_text: [{ text: { content: companyData.updates.employeeCount } }] };
    }
    
    if (companyData.updates.yearFounded) {
      properties['Year Founded'] = { number: companyData.updates.yearFounded };
    }
    
    if (companyData.updates.keyPeople) {
      properties['Key People'] = { rich_text: [{ text: { content: companyData.updates.keyPeople } }] };
    }
    
    if (companyData.updates.shortBlurb) {
      properties['Short Blurb'] = { rich_text: [{ text: { content: companyData.updates.shortBlurb } }] };
    }
    
    if (companyData.updates.aiFocusAreas) {
      properties['AI Focus Areas'] = { multi_select: companyData.updates.aiFocusAreas.map(area => ({ name: area })) };
    }
    
    // Update
    await notion.pages.update({
      page_id: page.id,
      properties
    });
    
    console.log(`   ✅ Updated ${Object.keys(properties).length} fields`);
    return { success: true, fieldsUpdated: Object.keys(properties).length };
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Updating More Companies from News Research\n');
  
  let successCount = 0;
  let totalFields = 0;
  const logs = [];
  
  for (const company of companyUpdates) {
    const result = await updateCompany(company);
    logs.push({ company: company.name, ...result });
    
    if (result.success) {
      successCount++;
      totalFields += result.fieldsUpdated;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Save log
  const logDir = path.join(__dirname, '../logs/news-research');
  fs.mkdirSync(logDir, { recursive: true });
  
  const timestamp = new Date().toISOString();
  const logFile = path.join(logDir, `${timestamp.split('T')[0]}_more_updates.json`);
  
  fs.writeFileSync(logFile, JSON.stringify({
    timestamp,
    companiesUpdated: successCount,
    totalFieldsUpdated: totalFields,
    logs
  }, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Update Complete!\n');
  console.log(`📊 Results:`);
  console.log(`   Companies updated: ${successCount}/${companyUpdates.length}`);
  console.log(`   Total fields updated: ${totalFields}`);
  console.log(`\n💎 Key Additions:`);
  console.log(`   - Moment Energy: $15M Series A (Jan 2025)`);
  console.log(`   - Phaidra: $12M Series A, ex-DeepMind team`);
  console.log(`   - Roomvu: US expansion, CIX Top 20 award`);
}

if (require.main === module) {
  main().catch(console.error);
}