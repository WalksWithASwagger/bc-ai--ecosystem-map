const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// Additional high-value companies with financial data
const additionalFinancialData = [
  // Gaming & Entertainment
  {
    name: "Phoenix Labs",
    category: "Game Development Studio",
    funding: {
      latest: "$35M Series C (2020)",
      total: "$65M+",
      details: "Co-op action RPG game developer",
      leadInvestor: "Sapphire Ventures",
      otherInvestors: ["NEA", "Garena", "Horizons Ventures"]
    },
    revenue: "$50M+ (est.)",
    employeeCount: "100-150",
    keyPeople: "Jesse Houston (CEO)",
    yearFounded: 2014,
    website: "https://phxlabs.ca",
    linkedin: "https://www.linkedin.com/company/phoenix-labs/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    shortBlurb: "Independent game studio creating co-op action RPGs including Dauntless and Fae Farm.",
    notableProjects: "Dauntless (50M+ players), Fae Farm"
  },
  {
    name: "Relic Entertainment",
    category: "Game Development Studio",
    funding: {
      latest: "Acquired by SEGA (2013)",
      total: "Part of SEGA",
      details: "AAA strategy game developer",
      leadInvestor: "SEGA (parent company)",
      otherInvestors: []
    },
    revenue: "$100M+ (est.)",
    employeeCount: "300+",
    keyPeople: "Justin Dowdeswell (GM)",
    yearFounded: 1997,
    website: "https://www.relic.com",
    linkedin: "https://www.linkedin.com/company/relic-entertainment/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    shortBlurb: "AAA game studio known for Company of Heroes and Age of Empires franchises.",
    notableProjects: "Company of Heroes 3, Age of Empires IV"
  },
  
  // HealthTech & BioTech
  {
    name: "Careteam Technologies",
    category: "Healthcare & Biotech",
    funding: {
      latest: "$7.2M Series A (2023)",
      total: "$10M+",
      details: "Virtual care platform",
      leadInvestor: "Information Venture Partners",
      otherInvestors: ["Real Ventures", "Panache Ventures"]
    },
    revenue: "$5M+ ARR",
    employeeCount: "50-100",
    keyPeople: "Alexandra Greenhill (CEO)",
    yearFounded: 2016,
    website: "https://careteam.ca",
    linkedin: "https://www.linkedin.com/company/careteam-technologies/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    shortBlurb: "Digital health platform connecting patients with healthcare teams for virtual care.",
    aiFocusAreas: ["Healthcare AI", "Virtual Care"],
    notableProjects: "Careteam platform, AI care coordination"
  },
  {
    name: "Response Biomedical",
    category: "Healthcare & Biotech",
    funding: {
      latest: "Public (TSX:RBM)",
      total: "Public company",
      details: "Rapid diagnostic tests",
      leadInvestor: "Public markets",
      otherInvestors: []
    },
    revenue: "$15M (2023)",
    employeeCount: "50-100",
    keyPeople: "Barbara Kinnaird (CEO)",
    yearFounded: 1988,
    website: "https://responsebio.com",
    linkedin: "https://www.linkedin.com/company/response-biomedical-corp/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    valuation: "$20M market cap",
    shortBlurb: "Developer of rapid point-of-care diagnostic tests for clinical and research use.",
    notableProjects: "RAMP platform, COVID-19 rapid tests"
  },
  
  // CleanTech & Sustainability
  {
    name: "Corvus Energy",
    category: "CleanTech",
    funding: {
      latest: "Acquired by Hanwha (2024)",
      total: "$100M+ raised",
      details: "Marine battery systems",
      leadInvestor: "Hanwha Ocean (acquirer)",
      otherInvestors: ["BDC Capital", "Sustainable Development Technology Canada"]
    },
    revenue: "$100M+ (2023)",
    employeeCount: "200+",
    keyPeople: "Sean Puchalski (CEO)",
    yearFounded: 2009,
    website: "https://corvusenergy.com",
    linkedin: "https://www.linkedin.com/company/corvus-energy/",
    bcRegion: "Lower Mainland",
    city: "Richmond, BC",
    valuation: "$500M+ (acquisition estimate)",
    shortBlurb: "Leading supplier of energy storage systems for maritime industry.",
    notableProjects: "Orca ESS platform, Blue Whale ESS"
  },
  {
    name: "Loop Energy",
    category: "CleanTech",
    funding: {
      latest: "Public (TSX:LPEN)",
      total: "$75M+ raised including IPO",
      details: "Hydrogen fuel cells",
      leadInvestor: "Public markets",
      otherInvestors: ["Sustainable Development Technology Canada", "BDC Capital"]
    },
    revenue: "$10M (2023)",
    employeeCount: "100+",
    keyPeople: "Ben Nyland (CEO)",
    yearFounded: 2000,
    website: "https://loopenergy.com",
    linkedin: "https://www.linkedin.com/company/loop-energy/",
    bcRegion: "Lower Mainland",
    city: "Burnaby, BC",
    valuation: "$50M market cap",
    shortBlurb: "Hydrogen fuel cell manufacturer for commercial mobility applications.",
    notableProjects: "eFlow fuel cell technology, S1200 fuel cell system"
  },
  
  // E-commerce & Retail Tech
  {
    name: "Thinkific",
    additionalData: {
      currentStatus: "Public company struggling with growth",
      stockPrice: "$1.50 CAD (down from $13 IPO price)",
      marketResponse: "Pivoting to enterprise focus"
    }
  },
  {
    name: "Reebee",
    category: "E-commerce",
    funding: {
      latest: "$10M Series B (2021)",
      total: "$17M+",
      details: "Digital flyer and deals platform",
      leadInvestor: "Impression Ventures",
      otherInvestors: ["BDC Capital", "Panache Ventures"]
    },
    revenue: "$10M+ (2023 est.)",
    employeeCount: "50-100",
    keyPeople: "Michal Martynek (CEO & Founder)",
    yearFounded: 2012,
    website: "https://www.reebee.com",
    linkedin: "https://www.linkedin.com/company/reebee/",
    bcRegion: "Other Regions",
    city: "Toronto, ON (BC operations)",
    shortBlurb: "Digital flyer platform helping consumers find deals and retailers reach shoppers.",
    notableProjects: "Reebee app (4M+ users), Retail analytics platform"
  },
  
  // Legal Tech
  {
    name: "Athennian",
    category: "Legal Tech",
    funding: {
      latest: "$23M Series B (2022)",
      total: "$33M+",
      details: "Entity management software",
      leadInvestor: "Round13 Capital",
      otherInvestors: ["Arthur Ventures", "Headline"]
    },
    revenue: "$15M+ ARR",
    employeeCount: "100-150",
    keyPeople: "Adrian Camara (CEO)",
    yearFounded: 2017,
    website: "https://www.athennian.com",
    linkedin: "https://www.linkedin.com/company/athennian/",
    bcRegion: "Other Regions",
    city: "Calgary, AB (BC customers)",
    shortBlurb: "Cloud-based entity management platform for law firms and legal departments.",
    aiFocusAreas: ["Legal Tech", "Document Automation"],
    notableProjects: "Entity management platform, AI document generation"
  },
  
  // Social Impact & Non-Profit Tech
  {
    name: "Traction on Demand",
    additionalData: {
      socialImpact: "1% pledge member, extensive pro-bono work",
      acquisitionDetails: "Became Salesforce's largest partner globally",
      founderStatus: "Greg Malpass remains as CEO post-acquisition"
    }
  },
  {
    name: "Chimp",
    category: "Fintech",
    funding: {
      latest: "$10M Series B (2020)",
      total: "$17M+",
      details: "Charitable giving platform",
      leadInvestor: "Yaletown Partners",
      otherInvestors: ["Impression Ventures", "Social Impact investors"]
    },
    revenue: "$300M+ in donations processed",
    employeeCount: "50-100",
    keyPeople: "John Bromley (CEO)",
    yearFounded: 2014,
    website: "https://chimp.net",
    linkedin: "https://www.linkedin.com/company/chimptech/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    shortBlurb: "Technology platform making charitable giving easy for individuals and companies.",
    notableProjects: "Chimp giving accounts, Corporate giving platform"
  },
  
  // InsurTech
  {
    name: "Lane",
    category: "Fintech",
    funding: {
      latest: "$4M Seed (2023)",
      total: "$4M",
      details: "Embedded insurance platform",
      leadInvestor: "Panache Ventures",
      otherInvestors: ["N49P", "Ascend Ventures"]
    },
    revenue: "Early revenue",
    employeeCount: "10-25",
    keyPeople: "Robert Howe (CEO & Co-founder)",
    yearFounded: 2021,
    website: "https://joinlane.com",
    linkedin: "https://www.linkedin.com/company/joinlane/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    shortBlurb: "API-first platform enabling companies to embed insurance products.",
    aiFocusAreas: ["InsurTech", "Risk Assessment"],
    notableProjects: "Insurance API platform, Risk assessment engine"
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

    if (financialData.revenue) {
      updates.properties['Revenue'] = {
        rich_text: [{
          text: {
            content: financialData.revenue
          }
        }]
      };
    }

    if (financialData.employeeCount) {
      updates.properties['Employee Count'] = {
        rich_text: [{
          text: {
            content: financialData.employeeCount
          }
        }]
      };
    }

    if (financialData.keyPeople) {
      updates.properties['Key People'] = {
        rich_text: [{
          text: {
            content: financialData.keyPeople
          }
        }]
      };
    }

    if (financialData.yearFounded) {
      updates.properties['Year Founded'] = {
        number: financialData.yearFounded
      };
    }

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

    // Add optional fields
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

async function researchAndUpdateAdditional() {
  console.log('Researching and updating additional high-value companies...\n');
  
  const results = {
    updated: [],
    created: [],
    errors: []
  };

  for (const company of additionalFinancialData) {
    console.log(`Processing ${company.name}...`);
    
    const existingOrg = await findOrganizationByName(company.name);
    
    if (existingOrg) {
      const updateResult = await updateOrganizationFinancials(existingOrg.id, company);
      
      if (updateResult) {
        results.updated.push({
          name: company.name,
          pageId: existingOrg.id,
          funding: company.funding?.latest || company.funding?.total || 'Updated',
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
    } else if (company.funding) {
      // Only create if it has funding data (not just additional data)
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
  const reportPath = `../data/reports/${timestamp}_additional-financial-updates.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('\n=== Additional Companies Update Summary ===');
  console.log(`Updated: ${results.updated.length} companies`);
  console.log(`Created: ${results.created.length} companies`);
  console.log(`Errors: ${results.errors.length} companies`);
  
  console.log('\n=== Major Additions ===');
  [...results.updated, ...results.created]
    .filter(c => c.funding && c.funding.includes('$'))
    .sort((a, b) => {
      const aAmount = parseInt(a.funding.match(/\$(\d+)/)?.[1] || 0);
      const bAmount = parseInt(b.funding.match(/\$(\d+)/)?.[1] || 0);
      return bAmount - aAmount;
    })
    .forEach(company => {
      console.log(`  - ${company.name}: ${company.funding}`);
    });
  
  console.log(`\nResults saved to: ${reportPath}`);
}

// Run the update
researchAndUpdateAdditional()
  .then(() => console.log('\nAdditional companies financial update complete!'))
  .catch(error => console.error('Error:', error));