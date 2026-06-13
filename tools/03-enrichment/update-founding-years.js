const { Client } = require('@notionhq/client');
const fs = require('fs');

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function findCompanyByName(name) {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        property: 'Name',
        title: {
          contains: name
        }
      }
    });
    
    return response.results.length > 0 ? response.results[0] : null;
  } catch (error) {
    console.error(`Error finding company ${name}:`, error.message);
    return null;
  }
}

async function updateFoundingYears() {
  const yearData = JSON.parse(fs.readFileSync('/Users/kk/ecosystem-map-bc-ai/data/discoveries/2025-08-04_year-revenue-updates.json', 'utf8'));
  
  console.log(`📊 Processing ${yearData.length} companies with founding year data...\n`);
  
  let updated = 0;
  let skipped = 0;
  let notFound = 0;
  
  for (const company of yearData) {
    // Skip obviously incorrect years
    if (company.yearFounded >= 2025 || company.yearFounded < 1900) {
      console.log(`⚠️  Skipping invalid year ${company.yearFounded} for ${company.name}`);
      skipped++;
      continue;
    }
    
    const existingPage = await findCompanyByName(company.name);
    
    if (existingPage) {
      try {
        await notion.pages.update({
          page_id: existingPage.id,
          properties: {
            'Year Founded': {
              number: company.yearFounded
            }
          }
        });
        
        console.log(`✅ Updated founding year for: ${company.name} (${company.yearFounded})`);
        updated++;
        
      } catch (error) {
        console.error(`❌ Error updating ${company.name}:`, error.message);
      }
    } else {
      console.log(`⚠️  Company not found in database: ${company.name}`);
      notFound++;
    }
  }
  
  // Also check if we have revenue data for Thinkific
  const fundingDiscovery = JSON.parse(fs.readFileSync('/Users/kk/ecosystem-map-bc-ai/data/discoveries/2025-08-04_founding-years-discovery.json', 'utf8'));
  
  for (const company of fundingDiscovery.companies) {
    if (company.revenue && company.name === 'Thinkific') {
      const existingPage = await findCompanyByName(company.name);
      if (existingPage) {
        try {
          const currentFunding = existingPage.properties.Funding?.rich_text[0]?.text?.content || '';
          const updatedFunding = currentFunding + `\nRevenue: ${company.revenue}`;
          
          await notion.pages.update({
            page_id: existingPage.id,
            properties: {
              'Funding': {
                rich_text: [{
                  text: {
                    content: updatedFunding
                  }
                }]
              }
            }
          });
          
          console.log(`✅ Updated revenue for: ${company.name} (${company.revenue})`);
        } catch (error) {
          console.error(`❌ Error updating revenue for ${company.name}:`, error.message);
        }
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated} companies`);
  console.log(`   Skipped (invalid years): ${skipped} companies`);
  console.log(`   Not found: ${notFound} companies`);
}

updateFoundingYears().catch(console.error);