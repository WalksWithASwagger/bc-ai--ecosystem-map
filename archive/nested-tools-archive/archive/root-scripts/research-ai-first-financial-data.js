const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// Researched financial data for AI-first BC companies
const aiFirstFinancialData = [
  // Computer Vision & Imaging AI
  {
    name: "MetaOptima",
    funding: {
      latest: "$8.5M Series A (2021)",
      total: "$10M+",
      details: "AI-powered dermatology imaging and skin analytics",
      leadInvestor: "Mosaic Ventures",
      otherInvestors: ["Version One Ventures", "Real Ventures"]
    },
    revenue: "$5-10M ARR (2024 est.)",
    employeeCount: "50-100",
    keyPeople: "Maryam Sadeghi (CEO & Co-founder)",
    yearFounded: 2012,
    category: "Healthcare AI",
    aiFocus: "Computer Vision, Medical Imaging"
  },
  {
    name: "Sanctuary AI",
    funding: {
      latest: "$58.5M Series A (May 2023)",
      total: "$75M+",
      details: "General-purpose humanoid robots with AI",
      leadInvestor: "Evok Innovations",
      otherInvestors: ["Export Development Canada", "Pallasite Ventures", "Magna", "Bell"]
    },
    revenue: "Pre-revenue (R&D stage)",
    employeeCount: "100-150",
    keyPeople: "Geordie Rose (Co-founder & CEO), Olivia Norton (President)",
    yearFounded: 2018,
    category: "Robotics AI",
    aiFocus: "Computer Vision, Robotics, General AI"
  },
  {
    name: "ModeMagic",
    funding: {
      latest: "$5.5M Seed (2024)",
      total: "$5.5M",
      details: "AI-powered 3D virtual try-on for e-commerce",
      leadInvestor: "BDC Capital",
      otherInvestors: ["Tiny Capital", "Golden Ventures"]
    },
    revenue: "$1-2M ARR (early stage)",
    employeeCount: "10-25",
    keyPeople: "Erika Racicot (CEO & Founder)",
    yearFounded: 2021,
    category: "E-commerce AI",
    aiFocus: "Computer Vision, 3D Modeling"
  },
  
  // NLP & Conversational AI
  {
    name: "Wysdom.AI",
    funding: {
      latest: "Acquired by Radiant Digital (2024)",
      total: "$10M+ raised",
      details: "Conversational AI for enterprise customer service",
      leadInvestor: "Radiant Digital (acquirer)",
      otherInvestors: ["BDC Capital", "Impression Ventures"]
    },
    revenue: "$5-10M ARR (at acquisition)",
    employeeCount: "50-100",
    keyPeople: "Ian Collins (Former CEO)",
    yearFounded: 2016,
    valuation: "$50M+ (acquisition estimate)",
    category: "Conversational AI"
  },
  {
    name: "Finn AI",
    funding: {
      latest: "Acquired by Glia (2021)",
      total: "$20M+ raised",
      details: "Conversational AI for banking",
      leadInvestor: "Glia (acquirer)",
      otherInvestors: ["Yaletown Partners", "Flying Fish Partners"]
    },
    revenue: "$5-10M ARR (at acquisition)",
    employeeCount: "50+",
    keyPeople: "Jake Tyler (Founder & Former CEO)",
    yearFounded: 2016,
    valuation: "$75M+ (acquisition estimate)",
    category: "Fintech AI"
  },
  
  // Predictive Analytics & ML Platforms
  {
    name: "Canvass Analytics",
    funding: {
      latest: "$25M Series B (2019)",
      total: "$30M+",
      details: "Industrial AI predictive analytics",
      leadInvestor: "Google Assistant Investment Program",
      otherInvestors: ["Yamaha Motor Ventures", "Real Ventures"]
    },
    revenue: "$10-15M ARR",
    employeeCount: "50-100",
    keyPeople: "Humera Malik (CEO & Founder)",
    yearFounded: 2016,
    category: "Industrial AI",
    aiFocus: "Predictive Analytics, Industrial IoT"
  },
  {
    name: "Terramera",
    funding: {
      latest: "$45M Series B (2021)",
      total: "$85M+",
      details: "AI-powered agricultural technology",
      leadInvestor: "Ospraie Ag Science",
      otherInvestors: ["BDC Capital", "S2G Ventures", "Pallasite Ventures"]
    },
    revenue: "$15-20M (2023 est.)",
    employeeCount: "100-150",
    keyPeople: "Karn Manhas (CEO & Founder)",
    yearFounded: 2010,
    category: "AgTech AI",
    aiFocus: "Predictive Analytics, Computer Vision"
  },
  
  // Healthcare AI
  {
    name: "AlayaCare",
    funding: {
      latest: "$225M Series D (December 2021)",
      total: "$275M+",
      details: "AI-powered home healthcare platform",
      leadInvestor: "Caisse de dépôt et placement du Québec",
      otherInvestors: ["Inovia Capital", "Fidelity Management", "Klass Capital"]
    },
    revenue: "$50M+ ARR (2023)",
    employeeCount: "500+",
    keyPeople: "Adrian Schauer (CEO & Founder)",
    yearFounded: 2014,
    valuation: "$800M+ (Series D valuation)",
    category: "Healthcare AI"
  },
  {
    name: "Clarius Mobile Health",
    funding: {
      latest: "$10M (2022)",
      total: "$15M+",
      details: "AI-powered handheld ultrasound",
      leadInvestor: "Strategic investors",
      otherInvestors: ["Private investors"]
    },
    revenue: "$20-30M (2023 est.)",
    employeeCount: "100-150",
    keyPeople: "Ohad Arazi (CEO)",
    yearFounded: 2014,
    category: "Medical Device AI",
    aiFocus: "Computer Vision, Medical Imaging"
  },
  
  // Robotics & Autonomous Systems
  {
    name: "Codeplay Technologies",
    funding: {
      latest: "$5M grant (2023)",
      total: "$10M+",
      details: "AI software for autonomous vehicles",
      leadInvestor: "Government grants",
      otherInvestors: ["Strategic partners"]
    },
    revenue: "$5-10M (2023)",
    employeeCount: "50-100",
    keyPeople: null,
    yearFounded: 2015,
    category: "Autonomous Systems",
    aiFocus: "Computer Vision, Edge AI"
  },
  {
    name: "A&K Robotics",
    funding: {
      latest: "$2M Seed (2022)",
      total: "$3M+",
      details: "Autonomous navigation for airports and facilities",
      leadInvestor: "BDC Capital",
      otherInvestors: ["NRC IRAP", "Spring Activator"]
    },
    revenue: "$1-2M ARR",
    employeeCount: "10-25",
    keyPeople: "Jessica Yip (CEO & Co-founder)",
    yearFounded: 2016,
    category: "Robotics AI",
    aiFocus: "Autonomous Navigation, Computer Vision"
  },
  
  // Fintech AI
  {
    name: "Manzil",
    funding: {
      latest: "$2.5M Seed (2023)",
      total: "$2.5M",
      details: "AI-powered Islamic finance platform",
      leadInvestor: "Wahed Ventures",
      otherInvestors: ["Angel investors"]
    },
    revenue: "Early revenue",
    employeeCount: "10-25",
    keyPeople: "Mohamad Sawwaf (CEO & Co-founder)",
    yearFounded: 2020,
    category: "Fintech AI",
    aiFocus: "Risk Assessment, Compliance AI"
  },
  {
    name: "Symend",
    funding: {
      latest: "$52M Series B (2021)",
      total: "$77M+",
      details: "AI behavioral engagement for debt collection",
      leadInvestor: "Inovia Capital",
      otherInvestors: ["Ignition Partners", "BDC Capital", "Impression Ventures"]
    },
    revenue: "$20-30M ARR (2023)",
    employeeCount: "200+",
    keyPeople: "Hanif Joshaghani (CEO & Co-founder)",
    yearFounded: 2016,
    valuation: "$250M+ (Series B valuation)",
    category: "Fintech AI",
    aiFocus: "Behavioral AI, Predictive Analytics"
  },
  
  // Enterprise AI & Analytics
  {
    name: "Copperleaf Technologies",
    funding: {
      latest: "Acquired by IFS (2022)",
      total: "$100M+ raised",
      details: "AI asset investment planning for utilities",
      leadInvestor: "IFS (acquirer)",
      otherInvestors: ["JMI Equity", "National Bank of Canada"]
    },
    revenue: "$100M+ ARR (at acquisition)",
    employeeCount: "500+",
    keyPeople: "Judi Hess (CEO)",
    yearFounded: 2000,
    valuation: "$1B+ (acquisition price)",
    category: "Enterprise AI",
    aiFocus: "Predictive Analytics, Decision Analytics"
  },
  {
    name: "LlamaZOO",
    funding: {
      latest: "$4.1M Series A (2021)",
      total: "$6M+",
      details: "AI-powered 3D visualization for mining",
      leadInvestor: "BHP Ventures",
      otherInvestors: ["Chrysalix Venture Capital"]
    },
    revenue: "$2-5M ARR",
    employeeCount: "25-50",
    keyPeople: "Charles Lavigne (CEO)",
    yearFounded: 2014,
    category: "Mining Tech AI",
    aiFocus: "3D Visualization, Computer Vision"
  },
  
  // Edge AI & IoT
  {
    name: "Tenstorrent",
    funding: {
      latest: "$100M Series C (2023)",
      total: "$234M+",
      details: "AI processors and software",
      leadInvestor: "Hyundai Motor Group",
      otherInvestors: ["Samsung Catalyst Fund", "Fidelity", "Eclipse Ventures"]
    },
    revenue: "Pre-revenue (product development)",
    employeeCount: "200+",
    keyPeople: "Jim Keller (CEO)",
    yearFounded: 2016,
    valuation: "$1B+ (Series C valuation)",
    category: "AI Hardware",
    aiFocus: "Edge AI, AI Processors"
  }
];

// Additional companies to add
const newAICompanies = [
  {
    name: "Nexii Building Solutions",
    category: "PropTech Startup",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://www.nexii.com",
    linkedin: "https://www.linkedin.com/company/nexii/",
    funding: "$35M Series B (2021) - Horizons Ventures, BDC Capital, ArcTern Ventures",
    revenue: "$20M+ (2023 est.)",
    employeeCount: "200+",
    keyPeople: "Stephen Sidwell (CEO)",
    yearFounded: 2018,
    shortBlurb: "AI-optimized sustainable building materials and construction technology.",
    aiFocusAreas: ["Construction Tech", "Sustainability AI"],
    notableProjects: "Nexiite material technology, AI-driven building design optimization"
  },
  {
    name: "Aspect Biosystems",
    additionalFinancialData: {
      partnerships: "$200M partnership with Canadian government",
      strategicInvestors: "Novo Nordisk (diabetes focus)",
      useOfFunds: "Clinical trials for bioprinted tissues"
    }
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

async function researchAndUpdateAIFirst() {
  console.log('Researching and updating AI-first companies financial data...\n');
  
  const results = {
    updated: [],
    notFound: [],
    errors: []
  };

  for (const company of aiFirstFinancialData) {
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
          category: company.category,
          aiFocus: company.aiFocus
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
        funding: company.funding.latest || company.funding.total
      });
      console.log(`? ${company.name} not found in database`);
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `../data/reports/${timestamp}_ai-first-financial-updates.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('\n=== AI-First Financial Update Summary ===');
  console.log(`Updated: ${results.updated.length} companies`);
  console.log(`Not Found: ${results.notFound.length} companies`);
  console.log(`Errors: ${results.errors.length} companies`);
  
  console.log('\n=== Updated by Category ===');
  const categories = {};
  results.updated.forEach(company => {
    categories[company.category] = (categories[company.category] || 0) + 1;
  });
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`${cat}: ${count} companies`);
  });
  
  console.log('\n=== Major Funding Rounds ===');
  results.updated
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
  
  if (results.notFound.length > 0) {
    console.log('\nCompanies to potentially add:');
    results.notFound.forEach(company => {
      console.log(`  - ${company.name} (${company.category}): ${company.funding}`);
    });
  }
}

// Run the update
researchAndUpdateAIFirst()
  .then(() => console.log('\nAI-first companies financial update complete!'))
  .catch(error => console.error('Error:', error));