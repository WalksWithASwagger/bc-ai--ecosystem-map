#!/usr/bin/env node
/**
 * Update Database from News Research
 * Updates the BC AI database with verified information from web search
 */

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.NOTION_DATABASE_ID;

// Research findings from web search
const researchFindings = [
  {
    name: "Denologix",
    updates: {
      revenue: "$2.4M annual revenue (2024)",
      funding: "Bootstrapped (no external funding)",
      employeeCount: "25 employees",
      yearFounded: 2002,
      shortBlurb: "IT consulting and outsourcing company with expertise in data management, advanced analytics, machine learning and AI. Bootstrapped to 100+ customers.",
      location: "Toronto, Canada (not Vancouver)"
    }
  },
  {
    name: "Youneeq",
    updates: {
      funding: "$250K Incubator/Accelerator funding (November 2023)\n\nInvestor: L'Oreal Open Innovation Challenge",
      yearFounded: 2014,
      keyPeople: "Murray Galbraith (Founder & CEO)",
      shortBlurb: "AI-powered cookieless personalization platform for e-commerce. Served over 1 billion personalized experiences. RC365 bought exclusive UK rights in August 2023.",
      location: "Victoria, BC"
    }
  },
  {
    name: "Silo AI Vancouver",
    updates: {
      funding: "Acquired by AMD for $665M (August 2024)",
      employeeCount: "300 employees globally (50% with PhDs)",
      shortBlurb: "Europe's largest private AI lab expanded to Vancouver in 2023 with 10+ person team. Acquired by AMD in August 2024 for $665M. Clients included Allianz, Philips, Rolls-Royce.",
      keyPeople: "Peter Sarlin (CEO & Co-founder), Team joined AMD AI Group under Vamsi Boppana"
    }
  },
  {
    name: "Leasey.AI",
    updates: {
      funding: "$100K CAD from DMZ Ventures (June 2024)\n\nPre-seed round",
      yearFounded: 2020,
      keyPeople: "Juan Leal (Co-founder & CEO)",
      shortBlurb: "Property management software that automates 90% of leasing tasks. Won $100K at DMZ Insiders event. Integrated with Zillow in August 2024. Addresses 50% understaffing in property management.",
      website: "https://www.leasey.ai/",
      address: "2490 Birch Street, Vancouver"
    }
  }
];

// Create research log
function createLog(company, updates, result) {
  return {
    company: company.name,
    timestamp: new Date().toISOString(),
    updates: updates,
    result: result
  };
}

// Update company in database
async function updateCompany(companyData) {
  console.log(`\n📝 Updating ${companyData.name}...`);
  
  try {
    // Find the company
    const response = await notion.databases.query({
      database_id: dbId,
      filter: {
        property: 'Name',
        title: { contains: companyData.name }
      }
    });
    
    if (response.results.length === 0) {
      console.log(`   ⚠️  Company not found in database`);
      return { success: false, error: 'Not found in database' };
    }
    
    const page = response.results[0];
    const properties = {};
    
    // Build updates based on available fields
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
    
    if (companyData.updates.website) {
      properties['Website'] = { url: companyData.updates.website };
    }
    
    // Update the page
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

// Main function
async function main() {
  console.log('🚀 Updating Database from News Research\n');
  console.log('Sources: Web search, Crunchbase, company websites, news articles\n');
  
  const logs = [];
  let successCount = 0;
  let totalFieldsUpdated = 0;
  
  for (const company of researchFindings) {
    const result = await updateCompany(company);
    const log = createLog(company, company.updates, result);
    logs.push(log);
    
    if (result.success) {
      successCount++;
      totalFieldsUpdated += result.fieldsUpdated;
    }
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Save logs
  const logDir = path.join(__dirname, '../logs/news-research');
  fs.mkdirSync(logDir, { recursive: true });
  
  const timestamp = new Date().toISOString().split('T')[0];
  const logFile = path.join(logDir, `${timestamp}_updates_from_news.json`);
  
  fs.writeFileSync(logFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    companiesUpdated: successCount,
    totalFieldsUpdated,
    logs
  }, null, 2));
  
  // Create markdown summary
  const mdFile = path.join(logDir, `${timestamp}_research_summary.md`);
  let mdContent = `# News Research Summary - ${timestamp}\n\n`;
  mdContent += `## Key Findings\n\n`;
  
  mdContent += `### 1. Denologix\n`;
  mdContent += `- **Revenue:** $2.4M (2024)\n`;
  mdContent += `- **Status:** Bootstrapped, 100+ customers\n`;
  mdContent += `- **Note:** Based in Toronto, not Vancouver\n\n`;
  
  mdContent += `### 2. Youneeq\n`;
  mdContent += `- **Funding:** $250K from L'Oreal (2023)\n`;
  mdContent += `- **Milestone:** 1 billion personalized experiences\n`;
  mdContent += `- **Expansion:** UK exclusive rights sold to RC365\n\n`;
  
  mdContent += `### 3. Silo AI Vancouver\n`;
  mdContent += `- **Exit:** Acquired by AMD for $665M (August 2024)\n`;
  mdContent += `- **Team:** 300 employees, 50% with PhDs\n`;
  mdContent += `- **Impact:** Major AI acquisition for BC ecosystem\n\n`;
  
  mdContent += `### 4. Leasey.AI\n`;
  mdContent += `- **Funding:** $100K from DMZ Ventures (June 2024)\n`;
  mdContent += `- **Product:** Automates 90% of property leasing tasks\n`;
  mdContent += `- **Integration:** Zillow partnership (August 2024)\n\n`;
  
  mdContent += `## Database Impact\n\n`;
  mdContent += `- Companies updated: ${successCount}\n`;
  mdContent += `- Total fields updated: ${totalFieldsUpdated}\n`;
  mdContent += `- Key additions: $665M exit, multiple funding rounds, revenue data\n`;
  
  fs.writeFileSync(mdFile, mdContent);
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('✅ News Research Update Complete!\n');
  console.log(`📊 Results:`);
  console.log(`   Companies updated: ${successCount}/${researchFindings.length}`);
  console.log(`   Total fields updated: ${totalFieldsUpdated}`);
  console.log(`\n💎 Key Highlights:`);
  console.log(`   - Added $665M AMD acquisition of Silo AI`);
  console.log(`   - Added $2.4M revenue for Denologix`);
  console.log(`   - Added recent funding rounds for Youneeq and Leasey.AI`);
  console.log(`\n📁 Logs saved to:`);
  console.log(`   JSON: ${logFile}`);
  console.log(`   Markdown: ${mdFile}`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { updateCompany };