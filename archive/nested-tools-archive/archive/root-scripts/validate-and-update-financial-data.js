const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// Validated financial data from BC_AI_COMPANIES_FINANCIAL_INTELLIGENCE_REPORT.md
const validatedFinancialData = [
  {
    name: "Aspect Biosystems",
    funding: {
      latest: "$115M Series B (January 2025)",
      total: "$139-211M",
      leadInvestor: "Dimension Capital",
      otherInvestors: ["Novo Nordisk", "Radical Ventures", "InBC", "Pallasite Ventures", "Pangaea Ventures", "Rhino Ventures", "T1D Fund", "Canadian Space Agency"],
      details: "Largest BC AI funding round to date"
    },
    revenue: null,
    employeeCount: "50-100",
    keyPeople: "Konrad Walus (Co-founder & CEO), Simon Beyer (Co-founder & CTO)",
    yearFounded: 2013
  },
  {
    name: "Hootsuite",
    funding: {
      latest: "$50.2M (March 2018)",
      total: "$300M across 6+ rounds",
      leadInvestor: "Insight Venture Partners",
      otherInvestors: ["Accel Partners", "OMERS Ventures", "Fidelity", "CIBC"],
      details: "Unicorn status ($1B valuation in 2014)"
    },
    revenue: "$350M (2024)",
    employeeCount: "1,722",
    keyPeople: "Irina Novoselsky (CEO), Ryan Holmes (Founder)",
    yearFounded: 2008
  },
  {
    name: "Browse AI",
    funding: {
      latest: "$2.8M Seed (November 2023)",
      total: "$3.2M",
      leadInvestor: "Co-founders of Dropbox, DoorDash",
      otherInvestors: ["Interface Capital", "Alpine Venture Capital", "AltaIR", "Banana Capital"],
      details: "Achieved profitability in April 2023"
    },
    revenue: "$1.9-2.1M (2024 est.)",
    employeeCount: "28-33",
    keyPeople: "Ardalan SadeghiKivi (CEO & Co-founder)",
    yearFounded: 2020
  },
  {
    name: "Produce8",
    funding: {
      latest: "$6M Seed (November 2022)",
      total: "$6.1M CAD",
      leadInvestor: "Top Down Ventures",
      otherInvestors: [],
      details: "Consistent revenue growth"
    },
    revenue: "$2.2M USD (2023)",
    employeeCount: "27",
    keyPeople: "Joel Abramson (CEO)",
    yearFounded: 2020
  },
  {
    name: "RIVAL Technologies",
    funding: {
      latest: "$8.5M Series A (July 2019)",
      total: "$6.51-9.2M",
      leadInvestor: "Adventure Capital",
      otherInvestors: ["The51 Ventures"],
      details: "Doubled funding target"
    },
    revenue: "~$1M ARR (2019)",
    employeeCount: "50-100",
    keyPeople: "Andrew Reid (CEO & Founder)",
    yearFounded: 2017
  },
  {
    name: "Open Ocean Robotics",
    funding: {
      latest: "$2.8M Pre-Series A (October 2024)",
      total: "$5.1-6M",
      leadInvestor: "Antares Ventures",
      otherInvestors: ["Spring Impact Capital", "Katapult Ocean", "Alacrity Canada", "DTN Ventures", "PacifiCan"],
      details: "NOAA contracts worth millions"
    },
    revenue: null,
    employeeCount: "11-50",
    keyPeople: "Julie Angus (CEO & Co-founder), Colin Angus (CTO & Co-founder)",
    yearFounded: 2018
  },
  {
    name: "Indiegraf",
    funding: {
      latest: "$2.2M Seed (October 2024)",
      total: "$3.5M USD",
      leadInvestor: "StandUp Ventures",
      otherInvestors: ["Coralus", "Mucker Capital", "Knight Foundation", "Google News Initiative"],
      details: "150+ community media businesses"
    },
    revenue: null,
    employeeCount: "11-50",
    keyPeople: "Erin Millar (CEO), Caitlin Havlak (COO)",
    yearFounded: 2020
  },
  {
    name: "MATT3R",
    funding: {
      latest: "$2M Pre-seed (2021)",
      total: "$2M+",
      leadInvestor: "Vancouver-based investors",
      otherInvestors: ["Nelson Investments"],
      details: "K3Y device launched Summer 2024"
    },
    revenue: null,
    employeeCount: "11-50",
    keyPeople: "Hamid Abdollahi (CEO)",
    yearFounded: 2020
  },
  {
    name: "Payday",
    funding: {
      latest: "$3M Seed (March 2023)",
      total: "$5.1M",
      leadInvestor: "Moniepoint Inc",
      otherInvestors: ["HoaQ", "DFS Lab's Stellar Africa Fund", "Ingressive Capital Fund II"],
      details: "Profitable since August 2022"
    },
    revenue: "$25M monthly processing",
    employeeCount: "35-50",
    keyPeople: "Favour Ori (CEO & Co-founder)",
    yearFounded: 2021
  },
  {
    name: "Flytographer",
    funding: {
      latest: null,
      total: "$1.72M",
      leadInvestor: null,
      otherInvestors: [],
      details: "776% two-year revenue growth"
    },
    revenue: "$3.5-3.8M (est.)",
    employeeCount: "105",
    keyPeople: "Nicole Smith (Founder)",
    yearFounded: 2013
  },
  {
    name: "Pano AI",
    funding: {
      latest: "$20M Series A (September 2022)",
      total: "$25M",
      leadInvestor: "Valor Equity Partners",
      otherInvestors: ["T-Mobile Ventures", "Salesforce Ventures"],
      details: "Wildfire detection technology"
    },
    revenue: null,
    employeeCount: "47",
    keyPeople: "Sonia Kastner (CEO), Arvind Satyam (CTO)",
    yearFounded: 2020
  },
  {
    name: "MarineLabs",
    funding: {
      latest: "$1.8M from Ocean Supercluster (January 2025)",
      total: "$4.5M project total",
      leadInvestor: "Canada's Ocean Supercluster",
      otherInvestors: ["Go Deep International", "LeeWay Marine"],
      details: "Major customers: Royal Canadian Navy, Canadian Coast Guard, BC Ferries"
    },
    revenue: null,
    employeeCount: "50+",
    keyPeople: null,
    yearFounded: 2017
  },
  {
    name: "ThisFish Inc.",
    funding: {
      latest: "$661,500 from Ocean Supercluster (September 2024)",
      total: "$1.16M+ from Ocean Supercluster",
      leadInvestor: "Canada's Ocean Supercluster",
      otherInvestors: ["Bitstrapped", "Orca Specialty Foods"],
      details: "Tally platform used globally"
    },
    revenue: null,
    employeeCount: "11-50",
    keyPeople: "Eric Enno Tamm (CEO & Founder)",
    yearFounded: 2010
  },
  {
    name: "OnDeck Fisheries AI",
    funding: {
      latest: "$1.5M from Ocean Supercluster (October 2023)",
      total: "$3.5M project total",
      leadInvestor: "Canada's Ocean Supercluster",
      otherInvestors: ["Teem Fish Monitoring", "Ha'oom Fisheries"],
      details: "AI-powered fisheries monitoring"
    },
    revenue: null,
    employeeCount: "11-50",
    keyPeople: null,
    yearFounded: 2021
  }
];

// Additional financial data from other sources
const additionalFinancialData = [
  {
    name: "Barnacle Systems",
    funding: {
      latest: "$513K Government Contract (2024)",
      total: "$513K+",
      leadInvestor: "Canadian Coast Guard",
      otherInvestors: ["Babcock Canada"],
      details: "39 BRNKL units sold to Canadian Coast Guard"
    },
    revenue: null,
    employeeCount: "11-50",
    keyPeople: "Brandon Wright (CEO & Founder)",
    yearFounded: 2016
  },
  {
    name: "4AG Robotics",
    funding: {
      latest: "PacifiCan Business Scale-up Program (March 2025)",
      total: "Undisclosed",
      leadInvestor: "PacifiCan",
      otherInvestors: [],
      details: "AI-powered robotic mushroom harvesting"
    },
    revenue: null,
    employeeCount: "11-50",
    keyPeople: "Sean O'Connor (CEO)",
    yearFounded: 2019
  },
  {
    name: "Rigid Robotics",
    funding: {
      latest: "$975,000 (November 2024)",
      total: "$975,000",
      leadInvestor: "PacifiCan Business Scale-up Program",
      otherInvestors: [],
      details: "AI-powered cloud platform for mining industry"
    },
    revenue: null,
    employeeCount: "11-50",
    keyPeople: null,
    yearFounded: 2021
  },
  {
    name: "HealthTech Connex",
    funding: {
      latest: "$3.7M (2024)",
      total: "$3.7M",
      leadInvestor: "PacifiCan Business Scale-up Program",
      otherInvestors: [],
      details: "AI-enhanced brain imaging medical device"
    },
    revenue: null,
    employeeCount: "11-50",
    keyPeople: null,
    yearFounded: 2019
  }
];

const allFinancialData = [...validatedFinancialData, ...additionalFinancialData];

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

    // Update funding information
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

    // Update revenue if available
    if (financialData.revenue) {
      updates.properties['Revenue'] = {
        rich_text: [{
          text: {
            content: financialData.revenue
          }
        }]
      };
    }

    // Update employee count if available
    if (financialData.employeeCount) {
      updates.properties['Employee Count'] = {
        rich_text: [{
          text: {
            content: financialData.employeeCount
          }
        }]
      };
    }

    // Update key people if available
    if (financialData.keyPeople) {
      updates.properties['Key People'] = {
        rich_text: [{
          text: {
            content: financialData.keyPeople
          }
        }]
      };
    }

    // Update year founded if available
    if (financialData.yearFounded) {
      updates.properties['Year Founded'] = {
        number: financialData.yearFounded
      };
    }

    const response = await notion.pages.update({
      page_id: pageId,
      ...updates
    });

    return response;
  } catch (error) {
    console.error(`Error updating organization ${pageId}:`, error);
    return null;
  }
}

async function validateAndUpdateFinancialData() {
  console.log('Starting financial data validation and update...\n');
  
  const results = {
    updated: [],
    notFound: [],
    errors: []
  };

  for (const company of allFinancialData) {
    console.log(`Processing ${company.name}...`);
    
    const org = await findOrganizationByName(company.name);
    
    if (org) {
      const updateResult = await updateOrganizationFinancials(org.id, company);
      
      if (updateResult) {
        results.updated.push({
          name: company.name,
          pageId: org.id,
          funding: company.funding.latest || company.funding.total,
          revenue: company.revenue
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
      results.notFound.push(company.name);
      console.log(`? ${company.name} not found in database`);
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `../data/reports/${timestamp}_financial-validation-results.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('\n=== Financial Data Validation Summary ===');
  console.log(`Updated: ${results.updated.length} organizations`);
  console.log(`Not Found: ${results.notFound.length} organizations`);
  console.log(`Errors: ${results.errors.length} organizations`);
  console.log(`\nResults saved to: ${reportPath}`);
  
  if (results.notFound.length > 0) {
    console.log('\nOrganizations not found in database:');
    results.notFound.forEach(name => console.log(`  - ${name}`));
  }
}

// Run the validation and update
validateAndUpdateFinancialData()
  .then(() => console.log('\nFinancial data validation and update complete!'))
  .catch(error => console.error('Error:', error));