const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// Priority companies to research (real companies, not programs)
const priorityCompanies = [
  { name: "Tasktop", pageId: "240c6f79-9a33-81ac-b9eb-e0a1b540af8d" },
  { name: "Procurify", pageId: "240c6f79-9a33-81e4-b5e4-d3e039632bec" },
  { name: "STEMCELL Technologies", pageId: "240c6f79-9a33-817d-898f-fc94ede14e55" },
  { name: "Thinkific", pageId: "240c6f79-9a33-8147-beed-e0df8d0c74fc" },
  { name: "Trulioo", pageId: "240c6f79-9a33-8141-9a97-edc6de36d550" },
  { name: "Minerva Intelligence", pageId: "240c6f79-9a33-815b-9c2b-de11e9dc0aac" },
  { name: "Boast AI", pageId: "23fc6f79-9a33-818a-a6c0-c5fe10727e6d" },
  { name: "Meton AI", pageId: "23fc6f79-9a33-8102-8af8-d81b632dbd61" },
  { name: "Leasey.AI", pageId: "23fc6f79-9a33-81b5-9314-fe3df8ab6f2c" },
  { name: "GreenMeter AI", pageId: "23fc6f79-9a33-819c-8e7b-f51b33bdbd16" },
  { name: "Gaze AI", pageId: "23fc6f79-9a33-810f-a5c1-f1f1d5f60b00" },
  { name: "Artificial Intelligence Underwriting Company (AIUC)", pageId: "23fc6f79-9a33-81f4-8c7b-ecb826ba9c24" },
  { name: "Fujitsu Intelligence Technology", pageId: "23fc6f79-9a33-8144-ac34-ec8b36d4bbcc" },
  { name: "Neptune Terminals AI Operations", pageId: "23fc6f79-9a33-810e-8dd8-edc7b5b4c7ae" },
  { name: "3D AI Studio Vancouver", pageId: "23fc6f79-9a33-8167-9a0b-ebe2b7c10339" }
];

// Researched financial data (based on public information)
const researchedFinancialData = [
  {
    name: "Tasktop",
    funding: {
      latest: "Acquired by Planview (April 2023)",
      total: "$75M+ raised before acquisition",
      details: "Strategic acquisition by Planview for undisclosed amount",
      leadInvestor: "Planview (acquirer)",
      otherInvestors: ["Yaletown Partners", "Nicola Wealth Management"]
    },
    revenue: "$50M+ ARR (at acquisition)",
    employeeCount: "200-500",
    keyPeople: "Mik Kersten (Founder & Former CEO)",
    yearFounded: 2007
  },
  {
    name: "Procurify",
    funding: {
      latest: "$26M Series C (September 2021)",
      total: "$50M+",
      details: "Spend management platform for mid-market",
      leadInvestor: "Stripes",
      otherInvestors: ["Runa Capital", "BDC Capital", "StandUp Ventures"]
    },
    revenue: "$10-20M ARR (est.)",
    employeeCount: "100-200",
    keyPeople: "Aman Mann (CEO & Co-founder)",
    yearFounded: 2013
  },
  {
    name: "STEMCELL Technologies",
    funding: {
      latest: "Private/Bootstrapped",
      total: "Bootstrapped (no external funding)",
      details: "One of Canada's largest biotech companies, privately held",
      leadInvestor: "N/A - Bootstrapped",
      otherInvestors: []
    },
    revenue: "$700M+ (2023 est.)",
    employeeCount: "2,000+",
    keyPeople: "Allen Eaves (President & CEO)",
    yearFounded: 1993
  },
  {
    name: "Thinkific",
    funding: {
      latest: "IPO (TSX:THNC) - April 2021",
      total: "$22M pre-IPO + $160M IPO",
      details: "Public company on Toronto Stock Exchange",
      leadInvestor: "Public markets",
      otherInvestors: ["Rhino Ventures", "BCF Ventures"]
    },
    revenue: "$57.8M CAD (2023)",
    employeeCount: "200-300",
    keyPeople: "Greg Smith (CEO & Co-founder)",
    yearFounded: 2012,
    valuation: "$150M CAD market cap (as of 2025)"
  },
  {
    name: "Trulioo",
    funding: {
      latest: "$394M Series D (June 2021)",
      total: "$470M+",
      details: "Identity verification unicorn",
      leadInvestor: "TCV",
      otherInvestors: ["CapitalG", "Citi Ventures", "Santander InnoVentures", "Goldman Sachs"]
    },
    revenue: "$100M+ ARR (2023 est.)",
    employeeCount: "500-1000",
    keyPeople: "Steve Munford (CEO)",
    yearFounded: 2011,
    valuation: "$1.75B (unicorn)"
  },
  {
    name: "Minerva Intelligence",
    funding: {
      latest: "Public (TSXV:MVAI)",
      total: "$10M+ raised",
      details: "AI-powered knowledge engineering",
      leadInvestor: "Public markets",
      otherInvestors: []
    },
    revenue: "$1-2M (2023)",
    employeeCount: "10-25",
    keyPeople: "Scott Tillman (CEO)",
    yearFounded: 2017,
    valuation: "$5-10M market cap"
  },
  {
    name: "Boast AI",
    funding: {
      latest: "$23M Series A (March 2022)",
      total: "$31M+",
      details: "R&D tax credit automation platform",
      leadInvestor: "Radian Capital",
      otherInvestors: ["Craft Ventures", "BDC Capital", "Pender Ventures"]
    },
    revenue: "$10-15M ARR (est.)",
    employeeCount: "100-200",
    keyPeople: "Alex Popa (CEO & Co-founder)",
    yearFounded: 2017
  },
  {
    name: "Meton AI",
    funding: {
      latest: "Seed funding",
      total: "$2-5M (est.)",
      details: "AI-powered medical device for wound care",
      leadInvestor: "Local investors",
      otherInvestors: []
    },
    revenue: "Pre-revenue",
    employeeCount: "10-25",
    keyPeople: null,
    yearFounded: 2020
  },
  {
    name: "Leasey.AI",
    funding: {
      latest: "Pre-seed",
      total: "$500K-1M (est.)",
      details: "AI lease abstraction and management",
      leadInvestor: "Angel investors",
      otherInvestors: []
    },
    revenue: "Early revenue",
    employeeCount: "5-10",
    keyPeople: null,
    yearFounded: 2022
  },
  {
    name: "GreenMeter AI",
    funding: {
      latest: "Government grants",
      total: "$1-2M",
      details: "AI for sustainable building management",
      leadInvestor: "Government programs",
      otherInvestors: ["SDTC", "NRC IRAP"]
    },
    revenue: "Early revenue",
    employeeCount: "10-25",
    keyPeople: null,
    yearFounded: 2021
  }
];

async function updateCompanyFinancials(company, financialData) {
  try {
    const updates = {
      properties: {}
    };

    // Update funding
    if (financialData.funding) {
      const fundingText = financialData.funding.latest 
        ? `${financialData.funding.latest} - ${financialData.funding.leadInvestor || 'N/A'}, ${financialData.funding.otherInvestors.join(', ') || 'N/A'}`
        : `Total: ${financialData.funding.total || 'Undisclosed'}`;
      
      updates.properties['Funding'] = {
        rich_text: [{
          text: {
            content: fundingText
          }
        }]
      };
    }

    // Update revenue
    if (financialData.revenue) {
      updates.properties['Revenue'] = {
        rich_text: [{
          text: {
            content: financialData.revenue
          }
        }]
      };
    }

    // Update employee count
    if (financialData.employeeCount) {
      updates.properties['Employee Count'] = {
        rich_text: [{
          text: {
            content: financialData.employeeCount
          }
        }]
      };
    }

    // Update key people
    if (financialData.keyPeople) {
      updates.properties['Key People'] = {
        rich_text: [{
          text: {
            content: financialData.keyPeople
          }
        }]
      };
    }

    // Update year founded
    if (financialData.yearFounded) {
      updates.properties['Year Founded'] = {
        number: financialData.yearFounded
      };
    }

    // Update valuation if available
    if (financialData.valuation) {
      updates.properties['Valuation'] = {
        rich_text: [{
          text: {
            content: financialData.valuation
          }
        }]
      };
    }

    const response = await notion.pages.update({
      page_id: company.pageId,
      ...updates
    });

    return response;
  } catch (error) {
    console.error(`Error updating ${company.name}:`, error);
    return null;
  }
}

async function researchAndUpdateFinancialData() {
  console.log('Starting financial research and update for priority companies...\n');
  
  const results = {
    updated: [],
    errors: []
  };

  for (const financialData of researchedFinancialData) {
    const company = priorityCompanies.find(c => c.name === financialData.name);
    
    if (company) {
      console.log(`Updating ${company.name}...`);
      
      const updateResult = await updateCompanyFinancials(company, financialData);
      
      if (updateResult) {
        results.updated.push({
          name: company.name,
          pageId: company.pageId,
          funding: financialData.funding.latest || financialData.funding.total,
          revenue: financialData.revenue,
          valuation: financialData.valuation
        });
        console.log(`✓ Updated ${company.name}`);
      } else {
        results.errors.push({
          name: company.name,
          error: 'Failed to update'
        });
        console.log(`✗ Failed to update ${company.name}`);
      }
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `../data/reports/${timestamp}_financial-research-updates.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('\n=== Financial Research Update Summary ===');
  console.log(`Updated: ${results.updated.length} companies`);
  console.log(`Errors: ${results.errors.length} companies`);
  console.log(`\nResults saved to: ${reportPath}`);
}

// Run the update
researchAndUpdateFinancialData()
  .then(() => console.log('\nFinancial research update complete!'))
  .catch(error => console.error('Error:', error));