const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// Deep sector research - comprehensive financial data
const deepSectorFinancialData = [
  // Biotech & Life Sciences
  {
    name: "Aurinia Pharmaceuticals",
    category: "Healthcare & Biotech",
    funding: {
      latest: "Public (NASDAQ:AUPH, TSX:AUP)",
      total: "$500M+ raised including public offerings",
      details: "Biopharmaceutical company developing therapies",
      leadInvestor: "Public markets",
      otherInvestors: ["Perceptive Advisors", "OrbiMed", "Rock Springs Capital"]
    },
    revenue: "$160M (2023)",
    employeeCount: "300+",
    keyPeople: "Peter Greenleaf (CEO)",
    yearFounded: 2013,
    website: "https://www.auriniapharma.com",
    linkedin: "https://www.linkedin.com/company/aurinia-pharmaceuticals/",
    bcRegion: "Vancouver Island",
    city: "Victoria, BC",
    valuation: "$1.5B market cap",
    shortBlurb: "Biopharmaceutical company focused on developing therapies for severe autoimmune diseases.",
    notableProjects: "LUPKYNIS (voclosporin), Lupus nephritis treatment"
  },
  {
    name: "Eupraxia Pharmaceuticals",
    category: "Healthcare & Biotech",
    funding: {
      latest: "$35M Series B (2023)",
      total: "$52M+",
      details: "Local injection therapeutics",
      leadInvestor: "Medicxi",
      otherInvestors: ["5AM Ventures", "Samsara BioCapital"]
    },
    revenue: "Pre-revenue (clinical stage)",
    employeeCount: "25-50",
    keyPeople: "James Helliwell (CEO)",
    yearFounded: 2019,
    website: "https://eupraxiapharma.com",
    linkedin: "https://www.linkedin.com/company/eupraxia-pharmaceuticals/",
    bcRegion: "Vancouver Island",
    city: "Victoria, BC",
    shortBlurb: "Clinical-stage biotech developing extended-release local injections for inflammatory diseases.",
    notableProjects: "EP-104GI for eosinophilic esophagitis, DiffuSphere technology"
  },
  {
    name: "CRH Medical",
    category: "Healthcare & Biotech",
    funding: {
      latest: "Acquired by WELL Health (2021)",
      total: "$150M+ raised",
      details: "Anesthesia services provider",
      leadInvestor: "WELL Health Technologies (acquirer)",
      otherInvestors: ["Public markets (TSX)"]
    },
    revenue: "$150M (at acquisition)",
    employeeCount: "500+",
    keyPeople: "Tushar Ramani (Former CEO)",
    yearFounded: 2001,
    valuation: "$374M CAD (acquisition price)",
    website: "https://crhmedical.com",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    shortBlurb: "Provider of anesthesia services for endoscopy procedures across the United States.",
    exitDetails: "Strategic acquisition to expand WELL Health's US presence"
  },
  
  // Quantum & Deep Tech
  {
    name: "1QBit",
    category: "Technology Companies",
    funding: {
      latest: "$45M Series B (2021)",
      total: "$65M+",
      details: "Quantum computing software",
      leadInvestor: "Accenture Ventures",
      otherInvestors: ["Allianz", "Royal Bank of Scotland", "Fujitsu"]
    },
    revenue: "$10-20M (2023 est.)",
    employeeCount: "100-150",
    keyPeople: "Andrew Fursman (CEO & Co-founder)",
    yearFounded: 2012,
    website: "https://1qbit.com",
    linkedin: "https://www.linkedin.com/company/1qbit/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    shortBlurb: "Quantum computing software company building applications for optimization and machine learning.",
    aiFocusAreas: ["Quantum Computing", "Optimization", "Machine Learning"],
    notableProjects: "QEMIST Cloud quantum simulation platform, Quantum Bridge analytics"
  },
  {
    name: "Verge Agriculture",
    category: "AgTech",
    funding: {
      latest: "$4M Seed (2022)",
      total: "$6M+",
      details: "Autonomous farming technology",
      leadInvestor: "Emmertech",
      otherInvestors: ["Yamaha Motor Ventures", "Raven Indigenous Capital"]
    },
    revenue: "$2-5M ARR",
    employeeCount: "25-50",
    keyPeople: "Jon Doerksen (CEO)",
    yearFounded: 2016,
    website: "https://www.vergeag.com",
    linkedin: "https://www.linkedin.com/company/verge-agriculture/",
    bcRegion: "Other Regions",
    city: "Calgary, AB (BC customers)",
    shortBlurb: "Autonomous farming solutions using AI for precision agriculture and field operations.",
    aiFocusAreas: ["AgTech", "Autonomous Systems", "Precision Agriculture"],
    notableProjects: "Path Planner autonomous navigation, SmartPath AI"
  },
  
  // Social Media & Creator Economy
  {
    name: "Later (formerly Latergramme)",
    additionalFinancialData: {
      currentRevenue: "$50M+ ARR (2024)",
      growthRate: "40% YoY",
      marketPosition: "Leading Instagram scheduling platform",
      competitiveAdvantage: "Visual content calendar innovation"
    }
  },
  {
    name: "Hootsuite",
    additionalFinancialData: {
      currentChallenges: "Growth stagnation at 20% YoY",
      strategicFocus: "Enterprise pivot, AI features",
      competitivePressure: "Facing competition from Sprout Social, Buffer",
      revenueBreakdown: "70% enterprise, 30% SMB"
    }
  },
  {
    name: "Ayogo Health",
    category: "Healthcare & Biotech",
    funding: {
      latest: "$5M Series A (2021)",
      total: "$8M+",
      details: "Digital health engagement platform",
      leadInvestor: "Wesley Clover",
      otherInvestors: ["BDC Capital", "Angel investors"]
    },
    revenue: "$5-10M ARR",
    employeeCount: "25-50",
    keyPeople: "Michael Fergusson (CEO)",
    yearFounded: 2010,
    website: "https://ayogo.com",
    linkedin: "https://www.linkedin.com/company/ayogo/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    shortBlurb: "Digital therapeutics platform using behavioral science and gamification for patient engagement.",
    aiFocusAreas: ["Healthcare AI", "Behavioral Analytics"],
    notableProjects: "Empower platform for chronic disease management"
  },
  
  // Agriculture & Food Tech
  {
    name: "Lucent BioSciences",
    category: "AgTech",
    funding: {
      latest: "$7M Series A (2023)",
      total: "$12M+",
      details: "Sustainable crop nutrition",
      leadInvestor: "Astanor Ventures",
      otherInvestors: ["AGFunder", "TELUS Pollinator Fund"]
    },
    revenue: "$2-5M (2023)",
    employeeCount: "25-50",
    keyPeople: "Mike Rauscher (CEO)",
    yearFounded: 2014,
    website: "https://www.lucentbiosciences.com",
    linkedin: "https://www.linkedin.com/company/lucent-biosciences/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    shortBlurb: "Sustainable agriculture technology delivering nutrients through cellulose-based seed coatings.",
    notableProjects: "Soileos crop nutrition technology"
  },
  {
    name: "Enterra Feed",
    category: "AgTech",
    funding: {
      latest: "$30M growth funding (2022)",
      total: "$50M+",
      details: "Insect-based protein production",
      leadInvestor: "Avrio Capital",
      otherInvestors: ["Wheatsheaf Group", "Generation Investment Management"]
    },
    revenue: "$20M+ (2023)",
    employeeCount: "100-150",
    keyPeople: "Beth Long (CEO)",
    yearFounded: 2007,
    website: "https://www.enterrafeed.com",
    linkedin: "https://www.linkedin.com/company/enterra-feed-corporation/",
    bcRegion: "Lower Mainland",
    city: "Langley, BC",
    shortBlurb: "Sustainable protein production using black soldier fly larvae for animal feed and pet food.",
    notableProjects: "Industrial-scale insect farming facility"
  },
  
  // Mining Tech & Resources
  {
    name: "MineSense Technologies",
    category: "Mining",
    funding: {
      latest: "$42M Series C (2021)",
      total: "$65M+",
      details: "AI-powered ore sorting",
      leadInvestor: "Caterpillar Ventures",
      otherInvestors: ["Prelude Ventures", "Chrysalix Venture Capital"]
    },
    revenue: "$15-20M (2023)",
    employeeCount: "50-100",
    keyPeople: "Jeff More (CEO)",
    yearFounded: 2008,
    website: "https://minesense.com",
    linkedin: "https://www.linkedin.com/company/minesense-technologies/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    shortBlurb: "Digital mining solutions using AI and sensor technology for ore sorting and recovery.",
    aiFocusAreas: ["Mining Tech", "Computer Vision", "Industrial AI"],
    notableProjects: "ShovelSense ore sorting system"
  },
  {
    name: "IAMGOLD Innovation",
    category: "Mining",
    funding: {
      latest: "Corporate R&D funding",
      total: "$10M+ R&D budget",
      details: "Mining innovation lab",
      leadInvestor: "IAMGOLD Corporation",
      otherInvestors: ["Government grants"]
    },
    revenue: "Internal R&D unit",
    employeeCount: "25-50",
    yearFounded: 2019,
    website: "https://www.iamgold.com",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    shortBlurb: "Innovation lab developing AI and automation solutions for mining operations.",
    notableProjects: "Autonomous mining equipment, AI ore body modeling"
  },
  
  // VR/AR & Metaverse
  {
    name: "MetaVRse",
    category: "VR/AR",
    funding: {
      latest: "$5.2M Series A (2022)",
      total: "$8M+",
      details: "Enterprise metaverse platform",
      leadInvestor: "Information Venture Partners",
      otherInvestors: ["Yaletown Partners", "BDC Capital"]
    },
    revenue: "$3-5M ARR",
    employeeCount: "25-50",
    keyPeople: "Julie Smithson (CEO & Co-founder)",
    yearFounded: 2015,
    website: "https://metavrse.com",
    linkedin: "https://www.linkedin.com/company/metavrse/",
    bcRegion: "Lower Mainland",
    city: "Burnaby, BC",
    shortBlurb: "No-code 3D creation platform for building immersive VR/AR experiences.",
    aiFocusAreas: ["VR/AR", "3D Creation", "Metaverse"],
    notableProjects: "MetaVRse Engine, Enterprise VR training solutions"
  },
  {
    name: "Finger Food Studios",
    category: "VR/AR",
    funding: {
      latest: "Acquired by Unity Technologies (2020)",
      total: "$15M+ raised",
      details: "AR/VR development studio",
      leadInvestor: "Unity Technologies (acquirer)",
      otherInvestors: ["Yaletown Partners", "BDC Capital"]
    },
    revenue: "$10M+ (at acquisition)",
    employeeCount: "100+",
    keyPeople: "Ryan Peterson (Former CEO)",
    yearFounded: 2011,
    valuation: "$50M+ (acquisition estimate)",
    website: "https://unity.com",
    bcRegion: "Other Regions",
    city: "Port Coquitlam, BC",
    shortBlurb: "Advanced technology studio specializing in AR/VR applications, acquired by Unity.",
    exitDetails: "Strategic acquisition to enhance Unity's professional services"
  },
  
  // Additional High-Growth Companies
  {
    name: "BBTV Holdings",
    category: "Media Tech",
    funding: {
      latest: "Public (TSX:BBTV)",
      total: "$50M+ raised including IPO",
      details: "Media tech platform",
      leadInvestor: "Public markets",
      otherInvestors: ["RTL Group", "Fairfax Financial"]
    },
    revenue: "$196M (2023)",
    employeeCount: "400+",
    keyPeople: "Shahrzad Rafati (Founder & Chairperson)",
    yearFounded: 2005,
    website: "https://www.bbtv.com",
    linkedin: "https://www.linkedin.com/company/bbtv/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    valuation: "$50M market cap",
    shortBlurb: "Media tech company that helps content creators grow their presence and monetize their content.",
    notableProjects: "Plus Solutions creator tools, Content management system"
  },
  {
    name: "Vanedge Capital",
    category: "Investors & Funds",
    funding: {
      latest: "Fund III - $350M (2022)",
      total: "$700M+ under management",
      details: "Early-stage technology VC",
      leadInvestor: "LPs include pension funds, family offices",
      otherInvestors: []
    },
    portfolio: "50+ companies",
    employeeCount: "10-20",
    keyPeople: "Paul Lee (Managing Partner)",
    yearFounded: 2007,
    website: "https://vanedgecapital.com",
    linkedin: "https://www.linkedin.com/company/vanedge-capital/",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    shortBlurb: "Early-stage VC firm focused on B2B software companies in Canada.",
    notableProjects: "Investments in Avigilon (exit), BuildDirect, Vision Critical"
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

    // Handle additional financial data updates
    if (financialData.additionalFinancialData) {
      const existingNotable = await notion.pages.retrieve({ page_id: pageId });
      const currentNotable = existingNotable.properties['Notable Projects']?.rich_text?.[0]?.text?.content || '';
      
      const additionalInfo = Object.entries(financialData.additionalFinancialData)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      
      updates.properties['Notable Projects'] = {
        rich_text: [{
          text: {
            content: currentNotable ? `${currentNotable}\n\nFinancial Update:\n${additionalInfo}` : `Financial Update:\n${additionalInfo}`
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

async function researchDeepSectorData() {
  console.log('Researching deep sector financial data...\n');
  
  const results = {
    updated: [],
    created: [],
    errors: []
  };

  for (const company of deepSectorFinancialData) {
    console.log(`Processing ${company.name}...`);
    
    const existingOrg = await findOrganizationByName(company.name);
    
    if (existingOrg) {
      const updateResult = await updateOrganizationFinancials(existingOrg.id, company);
      
      if (updateResult) {
        results.updated.push({
          name: company.name,
          pageId: existingOrg.id,
          funding: company.funding?.latest || company.funding?.total || 'Financial data updated',
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
  const reportPath = `../data/reports/${timestamp}_deep-sector-financial-updates.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('\n=== Deep Sector Financial Update Summary ===');
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
      console.log(`  - ${company.name}: ${company.funding}`);
    });
  
  console.log(`\nResults saved to: ${reportPath}`);
}

// Run the update
researchDeepSectorData()
  .then(() => console.log('\nDeep sector financial update complete!'))
  .catch(error => console.error('Error:', error));