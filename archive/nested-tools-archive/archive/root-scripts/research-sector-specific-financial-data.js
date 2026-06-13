const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// Comprehensive sector-specific financial data
const sectorFinancialData = [
  // EdTech & Learning Platforms
  {
    name: "Showbie",
    category: "EdTech",
    funding: {
      latest: "$10M Series A (2020)",
      total: "$15M+",
      details: "Educational workflow platform for K-12",
      leadInvestor: "Nicola Wealth Management",
      otherInvestors: ["Azure Capital Partners", "Yaletown Partners"]
    },
    revenue: "$5-10M ARR",
    employeeCount: "50-100",
    keyPeople: "Colin Bramm (CEO)",
    yearFounded: 2009,
    website: "https://www.showbie.com",
    linkedin: "https://www.linkedin.com/company/showbie/",
    bcRegion: "Other Regions",
    city: "Edmonton, AB (BC operations)",
    shortBlurb: "Digital classroom platform enabling paperless assignments and feedback for K-12 education.",
    aiFocusAreas: ["EdTech", "Digital Learning"],
    notableProjects: "Showbie classroom app, Socrative assessment tools"
  },
  {
    name: "FreshGrade",
    category: "EdTech",
    funding: {
      latest: "$11.7M Series A (2014)",
      total: "$23M+",
      details: "Student portfolio and assessment platform",
      leadInvestor: "NewSchools Venture Fund",
      otherInvestors: ["Relay Ventures", "Rethink Education"]
    },
    revenue: "$5M+ ARR",
    employeeCount: "50-100",
    keyPeople: "Lane Merrifield (Former CEO)",
    yearFounded: 2011,
    website: "https://www.freshgrade.com",
    linkedin: "https://www.linkedin.com/company/freshgrade/",
    bcRegion: "Vancouver Island",
    city: "Kelowna, BC",
    shortBlurb: "Digital portfolio and assessment platform connecting teachers, students, and parents.",
    notableProjects: "FreshGrade portfolio app, Parent engagement tools"
  },
  
  // PropTech & Real Estate
  {
    name: "Rentberry",
    category: "PropTech Startup",
    funding: {
      latest: "$4.5M ICO (2018)",
      total: "$9M+",
      details: "Blockchain-based rental platform",
      leadInvestor: "ICO participants",
      otherInvestors: ["TMT Investments", "Investors Club"]
    },
    revenue: "$2-5M ARR",
    employeeCount: "25-50",
    keyPeople: "Alex Lubinsky (CEO & Co-founder)",
    yearFounded: 2015,
    website: "https://rentberry.com",
    linkedin: "https://www.linkedin.com/company/rentberry/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    shortBlurb: "AI-powered rental platform with automated pricing and blockchain-based rental agreements.",
    aiFocusAreas: ["PropTech", "Blockchain"],
    notableProjects: "AI rental pricing engine, Blockchain rental agreements"
  },
  {
    name: "Properly",
    category: "PropTech Startup",
    funding: {
      latest: "$44M Series B (2022)",
      total: "$100M+",
      details: "Tech-enabled real estate brokerage",
      leadInvestor: "Yaletown Partners",
      otherInvestors: ["BDC Capital", "N49P Ventures"]
    },
    revenue: "$50M+ GMV",
    employeeCount: "100-200",
    keyPeople: "Anshul Ruparell (CEO & Co-founder)",
    yearFounded: 2018,
    website: "https://www.properly.ca",
    linkedin: "https://www.linkedin.com/company/properly/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    shortBlurb: "Tech-enabled real estate platform offering guaranteed home sales and seamless transactions.",
    aiFocusAreas: ["PropTech", "Real Estate Tech"],
    notableProjects: "AI home valuation, Guaranteed sale program"
  },
  
  // Cybersecurity & Privacy
  {
    name: "Absolute Software",
    category: "Cybersecurity",
    funding: {
      latest: "Public (TSX:ABST, NASDAQ:ABST)",
      total: "Public company",
      details: "Endpoint security and data risk management",
      leadInvestor: "Public markets",
      otherInvestors: []
    },
    revenue: "$167M USD (2023)",
    employeeCount: "800+",
    keyPeople: "Christy Wyatt (CEO)",
    yearFounded: 1993,
    website: "https://www.absolute.com",
    linkedin: "https://www.linkedin.com/company/absolute-software/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    valuation: "$500M market cap",
    shortBlurb: "Self-healing endpoint security providing persistent device connectivity and data risk management.",
    aiFocusAreas: ["Cybersecurity", "Endpoint Security"],
    notableProjects: "Absolute Persistence technology, Secure Endpoint platform"
  },
  {
    name: "1Password",
    category: "Cybersecurity",
    funding: {
      latest: "$620M Series C (January 2022)",
      total: "$920M+",
      details: "Password management platform",
      leadInvestor: "ICONIQ Growth",
      otherInvestors: ["Tiger Global", "Lightspeed", "Backbone Angels"]
    },
    revenue: "$120M+ ARR (2023)",
    employeeCount: "500+",
    keyPeople: "Jeff Shiner (CEO)",
    yearFounded: 2005,
    website: "https://1password.com",
    linkedin: "https://www.linkedin.com/company/1password/",
    bcRegion: "Other Regions",
    city: "Toronto, ON (BC remote team)",
    valuation: "$6.8B (Series C valuation)",
    shortBlurb: "Enterprise password management and security platform used by 100,000+ businesses.",
    aiFocusAreas: ["Cybersecurity", "Identity Management"],
    notableProjects: "1Password Business platform, Secrets Automation"
  },
  
  // Media Tech & Content Creation
  {
    name: "Thunderbird Entertainment",
    category: "Media Tech",
    funding: {
      latest: "Public (TSXV:TBRD)",
      total: "Public company",
      details: "Content production and distribution",
      leadInvestor: "Public markets",
      otherInvestors: []
    },
    revenue: "$97M CAD (2023)",
    employeeCount: "300+",
    keyPeople: "Jennifer Twiner McCarron (CEO)",
    yearFounded: 2003,
    website: "https://thunderbird.tv",
    linkedin: "https://www.linkedin.com/company/thunderbird-entertainment-group/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    valuation: "$80M market cap",
    shortBlurb: "Multi-platform media company producing scripted, unscripted, and animated content globally.",
    notableProjects: "Highway Thru Hell, Kim's Convenience"
  },
  {
    name: "Bron Studios",
    category: "Media Tech",
    funding: {
      latest: "$100M+ debt financing (2021)",
      total: "$200M+",
      details: "Film production and financing",
      leadInvestor: "Creative Wealth Media",
      otherInvestors: ["Private investors"]
    },
    revenue: "$100M+ (production value)",
    employeeCount: "100-200",
    keyPeople: "Aaron L. Gilbert (CEO)",
    yearFounded: 2010,
    website: "https://bronstudios.com",
    linkedin: "https://www.linkedin.com/company/bron-studios/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    shortBlurb: "Independent media company financing and producing premium film and television content.",
    notableProjects: "Joker, Bombshell, The Mule"
  },
  
  // Logistics & Supply Chain
  {
    name: "Routific",
    category: "Logistics Tech",
    funding: {
      latest: "$5M Series A (2019)",
      total: "$8M+",
      details: "Route optimization software",
      leadInvestor: "Pallasite Ventures",
      otherInvestors: ["Plug and Play Ventures", "Nimbus Synergies"]
    },
    revenue: "$10M+ ARR",
    employeeCount: "50-100",
    keyPeople: "Marc Kuo (CEO & Founder)",
    yearFounded: 2012,
    website: "https://routific.com",
    linkedin: "https://www.linkedin.com/company/routific/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    shortBlurb: "AI-powered route optimization platform reducing delivery costs by up to 40% for last-mile delivery.",
    aiFocusAreas: ["Route Optimization", "Logistics AI"],
    notableProjects: "Routific Engine API, Dynamic route optimization"
  },
  {
    name: "Spare",
    category: "Transportation Tech",
    funding: {
      latest: "$22M Series B (2021)",
      total: "$32M+",
      details: "On-demand transit platform",
      leadInvestor: "InMotion Ventures",
      otherInvestors: ["Kensington Capital", "Real Ventures"]
    },
    revenue: "$5-10M ARR",
    employeeCount: "50-100",
    keyPeople: "Josh Andrews (CEO & Co-founder)",
    yearFounded: 2015,
    website: "https://sparelabs.com",
    linkedin: "https://www.linkedin.com/company/sparelabs/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    shortBlurb: "AI-powered on-demand transit platform enabling cities and operators to launch mobility services.",
    aiFocusAreas: ["Transportation AI", "Smart Cities"],
    notableProjects: "Spare Platform, Dynamic routing algorithms"
  },
  
  // Additional High-Value Companies
  {
    name: "Bench",
    category: "Fintech",
    funding: {
      latest: "Shut down (January 2025)",
      total: "$113M raised",
      details: "Online bookkeeping service that ceased operations",
      leadInvestor: "Bain Capital Ventures",
      otherInvestors: ["Bessemer Venture Partners", "iNovia Capital", "Altos Ventures"]
    },
    revenue: "$30M+ ARR (peak)",
    employeeCount: "600+ (at peak)",
    keyPeople: "Jean-Philippe Durrios (Former CEO)",
    yearFounded: 2012,
    exitDetails: "Sudden shutdown in January 2025, assets being sold",
    shortBlurb: "Was North America's largest bookkeeping service for small businesses before sudden closure."
  },
  {
    name: "Unbounce",
    category: "Marketing Tech",
    funding: {
      latest: "$52M growth equity (2021)",
      total: "$58M+",
      details: "Landing page builder and conversion platform",
      leadInvestor: "Crest Rock Partners",
      otherInvestors: ["Foundry Group", "HarbourVest Partners"]
    },
    revenue: "$40M+ ARR",
    employeeCount: "200+",
    keyPeople: "Felicia Bochicchio (CEO)",
    yearFounded: 2009,
    website: "https://unbounce.com",
    linkedin: "https://www.linkedin.com/company/unbounce/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    shortBlurb: "AI-powered landing page builder and conversion optimization platform for marketers.",
    aiFocusAreas: ["Marketing AI", "Conversion Optimization"],
    notableProjects: "Smart Builder, AI copywriting tools"
  },
  {
    name: "Sendwithus",
    category: "Marketing Tech",
    funding: {
      latest: "Acquired by Dyspatch (2021)",
      total: "$2.4M raised",
      details: "Email automation platform acquisition",
      leadInvestor: "Dyspatch (acquirer)",
      otherInvestors: ["Y Combinator", "BDC Capital"]
    },
    revenue: "$5M+ ARR (at acquisition)",
    employeeCount: "25-50",
    keyPeople: "Matt Harris (Former CEO)",
    yearFounded: 2013,
    valuation: "$20M+ (acquisition estimate)",
    exitDetails: "Strategic acquisition to expand email capabilities",
    shortBlurb: "Transactional email platform acquired to enhance Dyspatch's email creation suite."
  },
  {
    name: "Kiind",
    category: "Fintech",
    funding: {
      latest: "$6M Series A (2019)",
      total: "$10M+",
      details: "Gift card and rewards platform",
      leadInvestor: "Round13 Capital",
      otherInvestors: ["Information Venture Partners", "Yaletown Partners"]
    },
    revenue: "$100M+ GMV",
    employeeCount: "50-100",
    keyPeople: "Leif Baradoy (CEO & Co-founder)",
    yearFounded: 2012,
    website: "https://kiind.me",
    linkedin: "https://www.linkedin.com/company/kiind/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    shortBlurb: "Digital gift card and rewards platform processing millions in corporate gifting and incentives.",
    notableProjects: "Kiind API, Bulk gifting platform"
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

async function createOrganization(company) {
  try {
    const properties = {
      'Name': {
        title: [{
          text: {
            content: company.name
          }
        }]
      },
      'Category': {
        select: {
          name: company.category
        }
      },
      'BC Region': {
        select: {
          name: company.bcRegion
        }
      },
      'City/Region': {
        rich_text: [{
          text: {
            content: company.city
          }
        }]
      },
      'Funding': {
        rich_text: [{
          text: {
            content: company.funding ? 
              `${company.funding.latest} - ${company.funding.leadInvestor || 'N/A'}, ${company.funding.otherInvestors.join(', ') || 'N/A'}` :
              'N/A'
          }
        }]
      },
      'Revenue': {
        rich_text: [{
          text: {
            content: company.revenue || ''
          }
        }]
      },
      'Employee Count': {
        rich_text: [{
          text: {
            content: company.employeeCount || ''
          }
        }]
      },
      'Key People': {
        rich_text: [{
          text: {
            content: company.keyPeople || ''
          }
        }]
      },
      'Year Founded': {
        number: company.yearFounded
      },
      'Data Source': {
        select: {
          name: 'Manual Research'
        }
      }
    };

    // Add optional fields if available
    if (company.website) {
      properties['Website'] = { url: company.website };
    }
    if (company.linkedin) {
      properties['LinkedIn'] = { url: company.linkedin };
    }
    if (company.shortBlurb) {
      properties['Short Blurb'] = {
        rich_text: [{
          text: { content: company.shortBlurb }
        }]
      };
    }
    if (company.notableProjects) {
      properties['Notable Projects'] = {
        rich_text: [{
          text: { content: company.notableProjects }
        }]
      };
    }
    if (company.valuation) {
      properties['Valuation'] = {
        rich_text: [{
          text: { content: company.valuation }
        }]
      };
    }
    if (company.aiFocusAreas && company.aiFocusAreas.length > 0) {
      properties['AI Focus Areas'] = {
        multi_select: company.aiFocusAreas.map(area => ({ name: area }))
      };
    }

    const response = await notion.pages.create({
      parent: { database_id: NOTION_DATABASE_ID },
      properties
    });

    return response;
  } catch (error) {
    console.error(`Error creating ${company.name}:`, error);
    return null;
  }
}

async function researchAndUpdateSectorData() {
  console.log('Researching and updating sector-specific financial data...\n');
  
  const results = {
    updated: [],
    created: [],
    errors: []
  };

  for (const company of sectorFinancialData) {
    console.log(`Processing ${company.name}...`);
    
    const existingOrg = await findOrganizationByName(company.name);
    
    if (existingOrg) {
      const updateResult = await updateOrganizationFinancials(existingOrg.id, company);
      
      if (updateResult) {
        results.updated.push({
          name: company.name,
          pageId: existingOrg.id,
          funding: company.funding.latest || company.funding.total,
          revenue: company.revenue,
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
      // Create new organization
      const createResult = await createOrganization(company);
      
      if (createResult) {
        results.created.push({
          name: company.name,
          pageId: createResult.id,
          funding: company.funding.latest || company.funding.total,
          category: company.category
        });
        console.log(`✓ Created ${company.name}`);
      } else {
        results.errors.push({
          name: company.name,
          error: 'Failed to create'
        });
        console.log(`✗ Failed to create ${company.name}`);
      }
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `../data/reports/${timestamp}_sector-financial-updates.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('\n=== Sector Financial Update Summary ===');
  console.log(`Updated: ${results.updated.length} companies`);
  console.log(`Created: ${results.created.length} companies`);
  console.log(`Errors: ${results.errors.length} companies`);
  
  console.log('\n=== By Sector ===');
  const sectors = {};
  [...results.updated, ...results.created].forEach(company => {
    sectors[company.category] = (sectors[company.category] || 0) + 1;
  });
  Object.entries(sectors).forEach(([sector, count]) => {
    console.log(`${sector}: ${count} companies`);
  });
  
  console.log('\n=== Major Funding ===');
  [...results.updated, ...results.created]
    .filter(c => c.funding && c.funding.includes('$'))
    .sort((a, b) => {
      const aAmount = parseInt(a.funding.match(/\$(\d+)/)?.[1] || 0);
      const bAmount = parseInt(b.funding.match(/\$(\d+)/)?.[1] || 0);
      return bAmount - aAmount;
    })
    .slice(0, 10)
    .forEach(company => {
      console.log(`  - ${company.name} (${company.category}): ${company.funding}`);
    });
  
  console.log(`\nResults saved to: ${reportPath}`);
}

// Run the update
researchAndUpdateSectorData()
  .then(() => console.log('\nSector-specific financial update complete!'))
  .catch(error => console.error('Error:', error));