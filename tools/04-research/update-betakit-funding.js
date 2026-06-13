const { Client } = require('@notionhq/client');
const fs = require('fs');

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function findCompanyByName(name) {
  try {
    // Clean up company name for better matching
    const cleanName = name.replace(/Vancouver-based |Vancouver's |Vancouver cleantech company |Vancouver cleantech |Vancouver EdTech startup /, '').trim();
    
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        property: 'Name',
        title: {
          contains: cleanName
        }
      }
    });
    
    if (response.results.length > 0) {
      return response.results[0];
    }
    
    // Try partial match
    const partialName = cleanName.split(' ')[0];
    const partialResponse = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      filter: {
        property: 'Name',
        title: {
          contains: partialName
        }
      }
    });
    
    return partialResponse.results.length > 0 ? partialResponse.results[0] : null;
  } catch (error) {
    console.error(`Error finding company ${name}:`, error.message);
    return null;
  }
}

async function updateFundingData() {
  const fundingData = JSON.parse(fs.readFileSync('/Users/kk/ecosystem-map-bc-ai/data/discoveries/2025-08-04_betakit-bc-funding.json', 'utf8'));
  
  console.log(`📊 Processing ${fundingData.companies.length} companies with funding data...\n`);
  
  let updated = 0;
  let notFound = 0;
  
  for (const company of fundingData.companies) {
    const existingPage = await findCompanyByName(company.companyName);
    
    if (existingPage) {
      try {
        // Prepare funding text
        const latestRound = company.fundingRounds[0];
        let fundingText = `${latestRound.amountRaw} ${latestRound.round}`;
        
        if (latestRound.date && !latestRound.date.includes('2025')) {
          fundingText += ` (${latestRound.date.split('\n')[0]})`;
        }
        
        if (latestRound.leadInvestor) {
          fundingText += ` - Lead: ${latestRound.leadInvestor}`;
        }
        
        if (latestRound.investors && latestRound.investors.length > 0) {
          const investorList = latestRound.investors.filter(inv => inv !== latestRound.leadInvestor).join(', ');
          if (investorList) {
            fundingText += `\nInvestors: ${investorList}`;
          }
        }
        
        fundingText += `\nTotal: ${company.totalRaised}M [BetaKit verified]`;
        
        // Update the page
        await notion.pages.update({
          page_id: existingPage.id,
          properties: {
            'Funding': {
              rich_text: [{
                text: {
                  content: fundingText
                }
              }]
            }
          }
        });
        
        console.log(`✅ Updated funding for: ${company.companyName}`);
        console.log(`   Amount: ${latestRound.amountRaw} ${latestRound.round}`);
        updated++;
        
      } catch (error) {
        console.error(`❌ Error updating ${company.companyName}:`, error.message);
      }
    } else {
      console.log(`⚠️  Company not found in database: ${company.companyName}`);
      notFound++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated} companies`);
  console.log(`   Not found: ${notFound} companies`);
}

updateFundingData().catch(console.error);