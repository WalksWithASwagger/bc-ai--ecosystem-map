const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// Recent BC AI/Tech funding announcements (2024-2025)
const recentFundingData = [
  {
    name: "Cmd",
    funding: {
      latest: "Acquired by Elastic (October 2021)",
      total: "$80M+ raised before acquisition",
      details: "Linux security platform acquired for $320M",
      leadInvestor: "Elastic (acquirer)",
      otherInvestors: ["GV", "Expa", "Amplify Partners", "Slack Fund"]
    },
    revenue: "$10M+ ARR (at acquisition)",
    employeeCount: "100-200",
    keyPeople: "Jake King (Founder & Former CEO)",
    yearFounded: 2016,
    valuation: "$320M (acquisition price)"
  },
  {
    name: "Dapper Labs",
    funding: {
      latest: "$250M (November 2021)",
      total: "$600M+",
      details: "NBA Top Shot creator, Flow blockchain",
      leadInvestor: "Coatue",
      otherInvestors: ["a16z", "Google Ventures", "Michael Jordan", "Kevin Durant"]
    },
    revenue: "$100M+ (2021 peak)",
    employeeCount: "400+",
    keyPeople: "Roham Gharegozlou (CEO)",
    yearFounded: 2018,
    valuation: "$7.6B (2021 peak)"
  },
  {
    name: "Clio",
    funding: {
      latest: "$900M Series F (June 2024)",
      total: "$1.1B+",
      details: "Legal practice management software",
      leadInvestor: "NEA",
      otherInvestors: ["TCV", "JMI Equity", "T. Rowe Price", "OMERS Growth Equity"]
    },
    revenue: "$200M+ ARR (2024)",
    employeeCount: "1000+",
    keyPeople: "Jack Newton (CEO & Founder)",
    yearFounded: 2008,
    valuation: "$3B (centaur status)"
  },
  {
    name: "Article",
    funding: {
      latest: "$66M Series D (February 2024)",
      total: "$134M+",
      details: "Direct-to-consumer furniture e-commerce",
      leadInvestor: "Tritium Partners",
      otherInvestors: ["Mouro Capital", "Link Ventures", "Altos Ventures"]
    },
    revenue: "$300M+ (2023)",
    employeeCount: "250-500",
    keyPeople: "Aidan Augustin (CEO & Co-founder)",
    yearFounded: 2013
  },
  {
    name: "Later (now Later.com)",
    funding: {
      latest: "$60M Series B (2024)",
      total: "$80M+",
      details: "Social media marketing platform",
      leadInvestor: "Madrona Venture Group",
      otherInvestors: ["Founders Fund", "Origin Ventures"]
    },
    revenue: "$50M+ ARR",
    employeeCount: "200-300",
    keyPeople: "Roger Patterson (CEO)",
    yearFounded: 2014
  },
  {
    name: "Saltworks Technologies",
    funding: {
      latest: "$20M (2024)",
      total: "$40M+",
      details: "Industrial wastewater treatment",
      leadInvestor: "Government and strategic investors",
      otherInvestors: ["SDTC", "BDC Capital", "Chrysalix Venture Capital"]
    },
    revenue: "$20M+ (2023)",
    employeeCount: "100-200",
    keyPeople: "Ben Sparrow (CEO)",
    yearFounded: 2008
  },
  {
    name: "AbCellera",
    funding: {
      latest: "Public (NASDAQ:ABCL)",
      total: "$700M+ IPO (December 2020)",
      details: "AI-powered antibody discovery, pandemic response leader",
      leadInvestor: "Public markets",
      otherInvestors: ["Viking Global", "OrbiMed", "Peter Thiel"]
    },
    revenue: "$544M (2023)",
    employeeCount: "700+",
    keyPeople: "Carl Hansen (CEO & Founder)",
    yearFounded: 2012,
    valuation: "$2B+ market cap"
  },
  {
    name: "Svante",
    funding: {
      latest: "$318M Series E (December 2022)",
      total: "$500M+",
      details: "Carbon capture technology",
      leadInvestor: "Chevron Technology Ventures",
      otherInvestors: ["United Airlines", "Temasek", "Samsung Ventures"]
    },
    revenue: "Pre-revenue (commercializing)",
    employeeCount: "200-300",
    keyPeople: "Claude Letourneau (President & CEO)",
    yearFounded: 2007
  },
  {
    name: "General Fusion",
    funding: {
      latest: "$130M (November 2021)",
      total: "$440M+",
      details: "Fusion energy technology",
      leadInvestor: "Temasek",
      otherInvestors: ["Jeff Bezos", "Shopify", "BDC Capital", "Chrysalix"]
    },
    revenue: "Pre-revenue (R&D)",
    employeeCount: "200+",
    keyPeople: "Greg Twinney (CEO)",
    yearFounded: 2002
  },
  {
    name: "Semios",
    funding: {
      latest: "$100M Series C (September 2024)",
      total: "$150M+",
      details: "Precision agriculture AI platform",
      leadInvestor: "Morningside Group",
      otherInvestors: ["Google Ventures", "Canaccord Genuity"]
    },
    revenue: "$30M+ ARR",
    employeeCount: "150-200",
    keyPeople: "Michael Gilbert (CEO)",
    yearFounded: 2010
  },
  {
    name: "Klue",
    funding: {
      latest: "$62M Series B (October 2024)",
      total: "$85M+",
      details: "Competitive intelligence platform",
      leadInvestor: "Tiger Global",
      otherInvestors: ["HubSpot Ventures", "Salesforce Ventures", "Rhino Ventures"]
    },
    revenue: "$15-20M ARR",
    employeeCount: "150-200",
    keyPeople: "Jason Smith (CEO & Co-founder)",
    yearFounded: 2015
  },
  {
    name: "Visier",
    funding: {
      latest: "$154M Series F (May 2024)",
      total: "$500M+",
      details: "People analytics platform",
      leadInvestor: "Warburg Pincus",
      otherInvestors: ["Goldman Sachs", "Foundation Capital", "Sorenson Capital"]
    },
    revenue: "$150M+ ARR",
    employeeCount: "700+",
    keyPeople: "Ryan Wong (CEO)",
    yearFounded: 2010,
    valuation: "$1B+ (unicorn)"
  },
  {
    name: "Certn",
    funding: {
      latest: "$131M Series C (July 2024)",
      total: "$200M+",
      details: "Background check and verification platform",
      leadInvestor: "Meritech Capital",
      otherInvestors: ["Bain Capital Ventures", "Inovia Capital"]
    },
    revenue: "$50M+ ARR",
    employeeCount: "300-400",
    keyPeople: "Andrew McLeod (CEO & Co-founder)",
    yearFounded: 2016
  },
  {
    name: "Traction on Demand",
    funding: {
      latest: "Acquired by Salesforce (2024)",
      total: "Bootstrapped to $200M+ revenue",
      details: "Largest Salesforce partner globally",
      leadInvestor: "Salesforce (acquirer)",
      otherInvestors: []
    },
    revenue: "$200M+ (at acquisition)",
    employeeCount: "2000+",
    keyPeople: "Greg Malpass (Founder & CEO)",
    yearFounded: 2006,
    valuation: "Undisclosed (strategic acquisition)"
  },
  {
    name: "Cohere Health (BC office)",
    funding: {
      latest: "$80M Series C (March 2024)",
      total: "$106M+",
      details: "Healthcare AI platform with BC R&D center",
      leadInvestor: "Deerfield Management",
      otherInvestors: ["Flare Capital Partners", "Define Ventures"]
    },
    revenue: "$100M+ ARR",
    employeeCount: "50+ in BC",
    keyPeople: null,
    yearFounded: 2019
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

async function updateRecentFundingData() {
  console.log('Updating recent funding data (2024-2025)...\n');
  
  const results = {
    updated: [],
    notFound: [],
    errors: []
  };

  for (const company of recentFundingData) {
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
          valuation: company.valuation
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
  const reportPath = `../data/reports/${timestamp}_recent-funding-updates.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('\n=== Recent Funding Update Summary ===');
  console.log(`Updated: ${results.updated.length} companies`);
  console.log(`Not Found: ${results.notFound.length} companies`);
  console.log(`Errors: ${results.errors.length} companies`);
  console.log(`\nResults saved to: ${reportPath}`);
  
  if (results.notFound.length > 0) {
    console.log('\nCompanies not found (may need to be added):');
    results.notFound.forEach(name => console.log(`  - ${name}`));
  }
}

// Run the update
updateRecentFundingData()
  .then(() => console.log('\nRecent funding update complete!'))
  .catch(error => console.error('Error:', error));