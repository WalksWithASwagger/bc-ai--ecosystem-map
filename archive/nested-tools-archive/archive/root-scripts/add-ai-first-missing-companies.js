const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// High-value AI-first companies to add
const aiFirstCompanies = [
  {
    name: "ModeMagic",
    category: "AI Companies",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://modemagic.com",
    linkedin: "https://www.linkedin.com/company/modemagic/",
    funding: "$5.5M Seed (2024) - BDC Capital, Tiny Capital, Golden Ventures",
    revenue: "$1-2M ARR (early stage)",
    employeeCount: "10-25",
    keyPeople: "Erika Racicot (CEO & Founder)",
    yearFounded: 2021,
    shortBlurb: "AI-powered 3D virtual try-on technology for e-commerce, enabling customers to visualize products in real-time.",
    aiFocusAreas: ["Computer Vision", "3D Modeling", "E-commerce"],
    notableProjects: "3D virtual try-on platform, AI body measurement technology"
  },
  {
    name: "Wysdom.AI",
    category: "AI Companies",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://wysdom.ai",
    linkedin: "https://www.linkedin.com/company/wysdom-ai/",
    funding: "Acquired by Radiant Digital (2024) - Radiant Digital (acquirer), BDC Capital, Impression Ventures",
    revenue: "$5-10M ARR (at acquisition)",
    employeeCount: "50-100",
    keyPeople: "Ian Collins (Former CEO)",
    yearFounded: 2016,
    valuation: "$50M+ (acquisition estimate)",
    shortBlurb: "Conversational AI platform for enterprise customer service automation and engagement.",
    aiFocusAreas: ["NLP", "Conversational AI", "Customer Service"],
    notableProjects: "Enterprise chatbot platform, AI customer service automation"
  },
  {
    name: "Canvass Analytics",
    category: "AI Companies",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://www.canvass.io",
    linkedin: "https://www.linkedin.com/company/canvass-analytics/",
    funding: "$25M Series B (2019) - Google Assistant Investment Program, Yamaha Motor Ventures, Real Ventures",
    revenue: "$10-15M ARR",
    employeeCount: "50-100",
    keyPeople: "Humera Malik (CEO & Founder)",
    yearFounded: 2016,
    shortBlurb: "Industrial AI platform for predictive analytics and process optimization in manufacturing.",
    aiFocusAreas: ["Predictive Analytics", "Industrial IoT", "Manufacturing"],
    notableProjects: "CANVASS AI platform, Industrial process optimization"
  },
  {
    name: "AlayaCare",
    category: "Healthcare & Biotech",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://alayacare.com",
    linkedin: "https://www.linkedin.com/company/alayacare/",
    funding: "$225M Series D (December 2021) - Caisse de dépôt et placement du Québec, Inovia Capital, Fidelity Management, Klass Capital",
    revenue: "$50M+ ARR (2023)",
    employeeCount: "500+",
    keyPeople: "Adrian Schauer (CEO & Founder)",
    yearFounded: 2014,
    valuation: "$800M+ (Series D valuation)",
    shortBlurb: "AI-powered home healthcare platform optimizing care delivery and operations for healthcare providers.",
    aiFocusAreas: ["Healthcare AI", "Predictive Analytics", "Care Optimization"],
    notableProjects: "AI care matching, Predictive visit verification, Clinical documentation automation"
  },
  {
    name: "Clarius Mobile Health",
    category: "Healthcare & Biotech",
    bcRegion: "Lower Mainland",
    city: "Burnaby, BC",
    website: "https://clarius.com",
    linkedin: "https://www.linkedin.com/company/clarius-mobile-health/",
    funding: "$10M (2022) - Strategic investors, Private investors",
    revenue: "$20-30M (2023 est.)",
    employeeCount: "100-150",
    keyPeople: "Ohad Arazi (CEO)",
    yearFounded: 2014,
    shortBlurb: "AI-powered handheld ultrasound devices with cloud connectivity and automated imaging assistance.",
    aiFocusAreas: ["Medical Imaging", "Computer Vision", "Healthcare AI"],
    notableProjects: "HD3 handheld ultrasound, AI-assisted imaging, Clarius Cloud platform"
  },
  {
    name: "A&K Robotics",
    category: "Robotics",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://www.aandkrobotics.com",
    linkedin: "https://www.linkedin.com/company/a&k-robotics/",
    funding: "$2M Seed (2022) - BDC Capital, NRC IRAP, Spring Activator",
    revenue: "$1-2M ARR",
    employeeCount: "10-25",
    keyPeople: "Jessica Yip (CEO & Co-founder)",
    yearFounded: 2016,
    shortBlurb: "Autonomous navigation robots for airports and large facilities, improving accessibility and operations.",
    aiFocusAreas: ["Autonomous Navigation", "Computer Vision", "Robotics"],
    notableProjects: "ARIS autonomous navigation platform, Airport assistance robots"
  },
  {
    name: "Symend",
    category: "Fintech",
    bcRegion: "Other Regions",
    city: "Calgary, AB (BC operations)",
    website: "https://symend.com",
    linkedin: "https://www.linkedin.com/company/symend/",
    funding: "$52M Series B (2021) - Inovia Capital, Ignition Partners, BDC Capital, Impression Ventures",
    revenue: "$20-30M ARR (2023)",
    employeeCount: "200+",
    keyPeople: "Hanif Joshaghani (CEO & Co-founder)",
    yearFounded: 2016,
    valuation: "$250M+ (Series B valuation)",
    shortBlurb: "AI-powered behavioral engagement platform for debt collection and customer retention.",
    aiFocusAreas: ["Behavioral AI", "Predictive Analytics", "Customer Engagement"],
    notableProjects: "Behavioral engagement platform, AI-driven customer outreach"
  },
  {
    name: "Copperleaf Technologies",
    category: "Enterprise / Corporate Divisions",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://www.copperleaf.com",
    linkedin: "https://www.linkedin.com/company/copperleaf-technologies/",
    funding: "Acquired by IFS (2022) - IFS (acquirer), JMI Equity, National Bank of Canada",
    revenue: "$100M+ ARR (at acquisition)",
    employeeCount: "500+",
    keyPeople: "Judi Hess (CEO)",
    yearFounded: 2000,
    valuation: "$1B+ (acquisition price)",
    shortBlurb: "AI-powered asset investment planning and management software for critical infrastructure companies.",
    aiFocusAreas: ["Predictive Analytics", "Decision Analytics", "Asset Management"],
    notableProjects: "C55 decision analytics platform, Asset investment optimization"
  },
  {
    name: "LlamaZOO",
    category: "Mining",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://www.llamazoo.com",
    linkedin: "https://www.linkedin.com/company/llamazoo-interactive/",
    funding: "$4.1M Series A (2021) - BHP Ventures, Chrysalix Venture Capital",
    revenue: "$2-5M ARR",
    employeeCount: "25-50",
    keyPeople: "Charles Lavigne (CEO)",
    yearFounded: 2014,
    shortBlurb: "AI-powered 3D visualization and digital twin solutions for mining and industrial operations.",
    aiFocusAreas: ["3D Visualization", "Computer Vision", "Digital Twins"],
    notableProjects: "MineLife VR platform, Guardian digital twin solution"
  },
  {
    name: "Tenstorrent",
    category: "Technology Companies",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://tenstorrent.com",
    linkedin: "https://www.linkedin.com/company/tenstorrent/",
    funding: "$100M Series C (2023) - Hyundai Motor Group, Samsung Catalyst Fund, Fidelity, Eclipse Ventures",
    revenue: "Pre-revenue (product development)",
    employeeCount: "200+",
    keyPeople: "Jim Keller (CEO)",
    yearFounded: 2016,
    valuation: "$1B+ (Series C valuation)",
    shortBlurb: "AI processor company developing high-performance chips and software for AI/ML workloads.",
    aiFocusAreas: ["AI Hardware", "Edge AI", "AI Processors"],
    notableProjects: "Grayskull AI processor, Wormhole architecture, AI software stack"
  },
  {
    name: "Manzil",
    category: "Fintech",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://getmanzil.com",
    linkedin: "https://www.linkedin.com/company/getmanzil/",
    funding: "$2.5M Seed (2023) - Wahed Ventures, Angel investors",
    revenue: "Early revenue",
    employeeCount: "10-25",
    keyPeople: "Mohamad Sawwaf (CEO & Co-founder)",
    yearFounded: 2020,
    shortBlurb: "AI-powered Islamic finance platform providing Sharia-compliant mortgage and investment solutions.",
    aiFocusAreas: ["Risk Assessment", "Compliance AI", "Islamic Finance"],
    notableProjects: "Halal mortgage platform, AI compliance engine"
  }
];

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
      'Website': {
        url: company.website
      },
      'LinkedIn': {
        url: company.linkedin
      },
      'Funding': {
        rich_text: [{
          text: {
            content: company.funding
          }
        }]
      },
      'Revenue': {
        rich_text: [{
          text: {
            content: company.revenue
          }
        }]
      },
      'Employee Count': {
        rich_text: [{
          text: {
            content: company.employeeCount
          }
        }]
      },
      'Key People': {
        rich_text: [{
          text: {
            content: company.keyPeople
          }
        }]
      },
      'Year Founded': {
        number: company.yearFounded
      },
      'Short Blurb': {
        rich_text: [{
          text: {
            content: company.shortBlurb
          }
        }]
      },
      'Notable Projects': {
        rich_text: [{
          text: {
            content: company.notableProjects
          }
        }]
      },
      'Data Source': {
        select: {
          name: 'Manual Research'
        }
      }
    };

    // Add valuation if available
    if (company.valuation) {
      properties['Valuation'] = {
        rich_text: [{
          text: {
            content: company.valuation
          }
        }]
      };
    }

    // Add AI Focus Areas
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

async function addAIFirstCompanies() {
  console.log('Adding AI-first companies to database...\n');
  
  const results = {
    added: [],
    errors: []
  };

  for (const company of aiFirstCompanies) {
    console.log(`Adding ${company.name}...`);
    
    const result = await createOrganization(company);
    
    if (result) {
      results.added.push({
        name: company.name,
        pageId: result.id,
        category: company.category,
        funding: company.funding,
        valuation: company.valuation,
        aiFocus: company.aiFocusAreas.join(', ')
      });
      console.log(`✓ Added ${company.name}`);
    } else {
      results.errors.push({
        name: company.name,
        error: 'Failed to add'
      });
      console.log(`✗ Failed to add ${company.name}`);
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `../data/reports/${timestamp}_ai-first-companies-added.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('\n=== AI-First Companies Addition Summary ===');
  console.log(`Added: ${results.added.length} companies`);
  console.log(`Errors: ${results.errors.length} companies`);
  
  console.log('\n=== AI Focus Areas ===');
  const focusAreas = {};
  results.added.forEach(company => {
    company.aiFocus.split(', ').forEach(area => {
      focusAreas[area] = (focusAreas[area] || 0) + 1;
    });
  });
  Object.entries(focusAreas)
    .sort((a, b) => b[1] - a[1])
    .forEach(([area, count]) => {
      console.log(`${area}: ${count} companies`);
    });
  
  console.log('\n=== Major Funding ===');
  results.added
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

// Run the addition
addAIFirstCompanies()
  .then(() => console.log('\nAI-first companies addition complete!'))
  .catch(error => console.error('Error:', error));