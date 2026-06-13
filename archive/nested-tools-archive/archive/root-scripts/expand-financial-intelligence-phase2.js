const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// Phase 2: Additional high-value companies with financial data
const phase2FinancialData = [
  // Quantum Computing
  {
    name: "D-Wave Systems",
    funding: {
      latest: "Public (NYSE:QBTS) via SPAC (August 2022)",
      total: "$300M+ raised pre-IPO",
      details: "Quantum computing pioneer, went public via SPAC merger",
      leadInvestor: "DPCM Capital (SPAC sponsor)",
      otherInvestors: ["PSP Investments", "Goldman Sachs", "BDC Capital", "Bezos Expeditions"]
    },
    revenue: "$8.2M (2023)",
    employeeCount: "200+",
    keyPeople: "Alan Baratz (CEO)",
    yearFounded: 1999,
    valuation: "$400M market cap (2025)",
    category: "Quantum Computing"
  },
  {
    name: "Photonic Inc.",
    funding: {
      latest: "$100M USD (November 2023)",
      total: "$140M+",
      details: "Quantum computing using silicon photonics",
      leadInvestor: "Microsoft",
      otherInvestors: ["British Columbia Investment Management Corporation", "Inovia Capital", "Amadeus Capital Partners"]
    },
    revenue: "Pre-revenue (R&D stage)",
    employeeCount: "120+",
    keyPeople: "Paul Terry (CEO), Stephanie Simmons (Founder & Chief Quantum Officer)",
    yearFounded: 2016,
    category: "Quantum Computing"
  },
  
  // Healthcare/Biotech AI
  {
    name: "Zymeworks",
    funding: {
      latest: "Public (NYSE:ZYME)",
      total: "$644M raised (including IPO)",
      details: "Biotherapeutics company using AI for drug discovery",
      leadInvestor: "Public markets",
      otherInvestors: ["Perceptive Advisors", "Echelon Wealth Partners", "CTI Life Sciences"]
    },
    revenue: "$124M (2023)",
    employeeCount: "450+",
    keyPeople: "Kenny Galbraith (CEO)",
    yearFounded: 2003,
    valuation: "$800M market cap",
    category: "Healthcare & Biotech"
  },
  {
    name: "Acuitas Therapeutics",
    funding: {
      latest: "$200M Series B (2023)",
      total: "$250M+",
      details: "Lipid nanoparticle delivery systems for mRNA vaccines",
      leadInvestor: "Undisclosed strategic investors",
      otherInvestors: ["Government of Canada", "Private investors"]
    },
    revenue: "$100M+ (licensing revenue)",
    employeeCount: "50-100",
    keyPeople: "Thomas Madden (CEO & Founder)",
    yearFounded: 2009,
    category: "Healthcare & Biotech"
  },
  {
    name: "Xenon Pharmaceuticals",
    funding: {
      latest: "Public (NASDAQ:XENE)",
      total: "$500M+ raised",
      details: "Precision medicine using genetics and AI",
      leadInvestor: "Public markets",
      otherInvestors: ["Genentech", "Teva", "BVF Partners"]
    },
    revenue: "$30M (2023)",
    employeeCount: "150+",
    keyPeople: "Ian Mortimer (CEO)",
    yearFounded: 1996,
    valuation: "$1.8B market cap",
    category: "Healthcare & Biotech"
  },
  
  // Gaming/VR/AR
  {
    name: "Kabam",
    funding: {
      latest: "Acquired by Netmarble (2017)",
      total: "$244M raised before acquisition",
      details: "Mobile gaming studio, acquired for $800M",
      leadInvestor: "Netmarble (acquirer)",
      otherInvestors: ["Alibaba", "Google", "Intel Capital", "Warner Bros"]
    },
    revenue: "$400M (at acquisition)",
    employeeCount: "700+",
    keyPeople: "Tim Fields (CEO)",
    yearFounded: 2006,
    valuation: "$800M (acquisition price)",
    category: "Gaming"
  },
  {
    name: "Archiact",
    funding: {
      latest: "$10M Series A (2021)",
      total: "$15M+",
      details: "VR gaming studio",
      leadInvestor: "Makers Fund",
      otherInvestors: ["Presence Capital", "BITKRAFT Ventures"]
    },
    revenue: "$5-10M (est.)",
    employeeCount: "50-100",
    keyPeople: "Derek Chen (CEO)",
    yearFounded: 2013,
    category: "VR/AR"
  },
  
  // Fintech/Blockchain
  {
    name: "Mogo",
    funding: {
      latest: "Public (TSX:MOGO, NASDAQ:MOGO)",
      total: "$200M+ raised",
      details: "Digital financial platform",
      leadInvestor: "Public markets",
      otherInvestors: ["Power Financial", "Difference Capital"]
    },
    revenue: "$73M (2023)",
    employeeCount: "200+",
    keyPeople: "David Feller (CEO & Founder)",
    yearFounded: 2003,
    valuation: "$100M market cap",
    category: "Fintech"
  },
  {
    name: "Coinsquare",
    funding: {
      latest: "$83.2M (December 2021)",
      total: "$159M+",
      details: "Cryptocurrency exchange",
      leadInvestor: "Mogo",
      otherInvestors: ["Canaccord Genuity", "Mavenwood Capital"]
    },
    revenue: "$50M+ (est.)",
    employeeCount: "150+",
    keyPeople: "Martin Piszel (CEO)",
    yearFounded: 2014,
    valuation: "$500M+ (peak valuation)",
    category: "Blockchain"
  },
  {
    name: "Nymi",
    funding: {
      latest: "$31M Series B",
      total: "$45M+",
      details: "Biometric authentication for workplace",
      leadInvestor: "Relay Ventures",
      otherInvestors: ["Ignition Partners", "Salesforce Ventures", "MasterCard"]
    },
    revenue: "$10-20M (est.)",
    employeeCount: "50-100",
    keyPeople: "Chris Sullivan (CEO)",
    yearFounded: 2011,
    category: "Fintech"
  },
  
  // Recent Exits/Acquisitions with Financial Details
  {
    name: "Kindred",
    funding: {
      latest: "Acquired by Ocado (November 2020)",
      total: "$44M raised before acquisition",
      details: "Robotics AI company acquired for $262M",
      leadInvestor: "Ocado (acquirer)",
      otherInvestors: ["Eclipse Ventures", "Amplify Partners", "Google Ventures"]
    },
    revenue: "Pre-revenue (at acquisition)",
    employeeCount: "100+ (at acquisition)",
    keyPeople: "Marin Tchakarov (Former CEO), Geordie Rose (Founder)",
    yearFounded: 2014,
    valuation: "$262M (acquisition price)",
    category: "Robotics"
  },
  {
    name: "Vision Critical",
    funding: {
      latest: "Acquired by Veritas Capital (2014)",
      total: "$90M+ raised",
      details: "Market research software, acquired for $300M+",
      leadInvestor: "Veritas Capital (acquirer)",
      otherInvestors: ["OMERS Ventures", "Salesforce"]
    },
    revenue: "$100M+ (at acquisition)",
    employeeCount: "750+ (at peak)",
    keyPeople: "Ross Wainwright (CEO)",
    yearFounded: 2000,
    valuation: "$300M+ (acquisition price)",
    category: "SaaS"
  },
  {
    name: "Slack (Vancouver office)",
    funding: {
      latest: "Acquired by Salesforce (July 2021)",
      total: "$1.4B raised (globally)",
      details: "Workplace messaging, acquired for $27.7B",
      leadInvestor: "Salesforce (acquirer)",
      otherInvestors: ["Accel", "a16z", "Google Ventures", "Kleiner Perkins"]
    },
    revenue: "$900M (2020)",
    employeeCount: "300+ in Vancouver",
    keyPeople: "Stewart Butterfield (Co-founder & Former CEO)",
    yearFounded: 2009,
    valuation: "$27.7B (acquisition price)",
    category: "SaaS"
  },
  
  // CleanTech/Sustainability
  {
    name: "Carbon Engineering",
    funding: {
      latest: "$68M (2019)",
      total: "$135M+",
      details: "Direct air capture technology",
      leadInvestor: "Oxy Low Carbon Ventures",
      otherInvestors: ["Bill Gates", "BHP", "Chevron Technology Ventures"]
    },
    revenue: "Pre-revenue (commercializing)",
    employeeCount: "150+",
    keyPeople: "Daniel Friedmann (CEO)",
    yearFounded: 2009,
    category: "CleanTech"
  },
  {
    name: "Ballard Power Systems",
    funding: {
      latest: "Public (TSX:BLDP, NASDAQ:BLDP)",
      total: "$1B+ raised",
      details: "Fuel cell technology leader",
      leadInvestor: "Public markets",
      otherInvestors: ["Weichai Power", "Broad-Ocean Motor"]
    },
    revenue: "$104M (2023)",
    employeeCount: "1,300+",
    keyPeople: "Randy MacEwen (CEO)",
    yearFounded: 1979,
    valuation: "$600M market cap",
    category: "CleanTech"
  }
];

async function findOrganizationByName(name) {
  try {
    const response = await notion.databases.query({
      database_id: NOTION_DATABASE_ID,
      filter: {
        property: 'Name',
        title: {
          contains: name
        }
      }
    });
    
    return response.results.length > 0 ? response.results[0] : null;
  } catch (error) {
    console.error(`Error finding organization ${name}:`, error);
    return null;
  }
}

async function updateOrganizationFinancials(pageId, financialData) {
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

    // Update valuation
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
      page_id: pageId,
      ...updates
    });

    return response;
  } catch (error) {
    console.error(`Error updating organization:`, error);
    return null;
  }
}

async function expandFinancialIntelligencePhase2() {
  console.log('Expanding financial intelligence - Phase 2...\n');
  
  const results = {
    updated: [],
    notFound: [],
    errors: []
  };

  for (const company of phase2FinancialData) {
    console.log(`Processing ${company.name}...`);
    
    const org = await findOrganizationByName(company.name);
    
    if (org) {
      const updateResult = await updateOrganizationFinancials(org.id, company);
      
      if (updateResult) {
        results.updated.push({
          name: company.name,
          pageId: org.id,
          funding: company.funding.latest || company.funding.total,
          revenue: company.revenue,
          valuation: company.valuation,
          category: company.category
        });
        console.log(`✓ Updated ${company.name}`);
      } else {
        results.errors.push({
          name: company.name,
          error: 'Failed to update'
        });
        console.log(`✗ Failed to update ${company.name}`);
      }
    } else {
      results.notFound.push({
        name: company.name,
        category: company.category,
        fundingInfo: company.funding.latest || company.funding.total
      });
      console.log(`? ${company.name} not found in database`);
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `../data/reports/${timestamp}_financial-expansion-phase2-results.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('\n=== Financial Intelligence Expansion Phase 2 Summary ===');
  console.log(`Updated: ${results.updated.length} companies`);
  console.log(`Not Found: ${results.notFound.length} companies`);
  console.log(`Errors: ${results.errors.length} companies`);
  
  console.log('\n=== Category Breakdown ===');
  const categories = {};
  results.updated.forEach(company => {
    categories[company.category] = (categories[company.category] || 0) + 1;
  });
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`${cat}: ${count} companies updated`);
  });
  
  console.log(`\nResults saved to: ${reportPath}`);
  
  if (results.notFound.length > 0) {
    console.log('\nHigh-value companies to potentially add:');
    results.notFound.forEach(company => {
      console.log(`  - ${company.name} (${company.category}): ${company.fundingInfo}`);
    });
  }
}

// Run the expansion
expandFinancialIntelligencePhase2()
  .then(() => console.log('\nFinancial intelligence expansion phase 2 complete!'))
  .catch(error => console.error('Error:', error));