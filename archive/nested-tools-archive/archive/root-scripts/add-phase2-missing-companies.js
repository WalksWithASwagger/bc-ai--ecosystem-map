const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// High-value Phase 2 companies to add
const phase2Companies = [
  {
    name: "Photonic Inc.",
    category: "Technology Companies", 
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://photonic.com",
    linkedin: "https://www.linkedin.com/company/photonic-inc/",
    funding: "$100M USD (November 2023) - Microsoft, British Columbia Investment Management Corporation, Inovia Capital, Amadeus Capital Partners",
    revenue: "Pre-revenue (R&D stage)",
    employeeCount: "120+",
    keyPeople: "Paul Terry (CEO), Stephanie Simmons (Founder & Chief Quantum Officer)",
    yearFounded: 2016,
    shortBlurb: "Quantum computing company using silicon photonics to build scalable, fault-tolerant quantum computers.",
    aiFocusAreas: ["Quantum Computing", "Advanced Computing"],
    notableProjects: "Silicon spin-photon interface, Distributed quantum computing architecture"
  },
  {
    name: "Acuitas Therapeutics",
    category: "Healthcare & Biotech",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://acuitastx.com",
    linkedin: "https://www.linkedin.com/company/acuitas-therapeutics/",
    funding: "$200M Series B (2023) - Undisclosed strategic investors, Government of Canada, Private investors",
    revenue: "$100M+ (licensing revenue)",
    employeeCount: "50-100",
    keyPeople: "Thomas Madden (CEO & Founder)",
    yearFounded: 2009,
    shortBlurb: "Lipid nanoparticle delivery systems crucial for mRNA vaccines including COVID-19 vaccines.",
    aiFocusAreas: ["Drug Delivery", "Biotechnology"],
    notableProjects: "LNP technology licensed for Pfizer-BioNTech COVID vaccine, mRNA therapeutics delivery"
  },
  {
    name: "Xenon Pharmaceuticals",
    category: "Healthcare & Biotech",
    bcRegion: "Lower Mainland", 
    city: "Burnaby, BC",
    website: "https://www.xenon-pharma.com",
    linkedin: "https://www.linkedin.com/company/xenon-pharmaceuticals/",
    funding: "Public (NASDAQ:XENE) - Public markets, Genentech, Teva, BVF Partners",
    revenue: "$30M (2023)",
    employeeCount: "150+",
    keyPeople: "Ian Mortimer (CEO)",
    yearFounded: 1996,
    valuation: "$1.8B market cap",
    shortBlurb: "Precision medicine company using human genetics to develop innovative therapeutics for neurological disorders.",
    aiFocusAreas: ["Precision Medicine", "Drug Discovery"],
    notableProjects: "XEN1101 epilepsy treatment, Ion channel drug discovery platform"
  },
  {
    name: "Kabam",
    category: "Game Development Studio",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://www.kabam.com",
    linkedin: "https://www.linkedin.com/company/kabam/",
    funding: "Acquired by Netmarble (2017) - Netmarble (acquirer), Alibaba, Google, Intel Capital, Warner Bros",
    revenue: "$400M (at acquisition)",
    employeeCount: "700+",
    keyPeople: "Tim Fields (CEO)",
    yearFounded: 2006,
    valuation: "$800M (acquisition price)",
    shortBlurb: "Mobile gaming studio known for Marvel Contest of Champions and other successful mobile games.",
    aiFocusAreas: ["Gaming AI", "Mobile Gaming"],
    notableProjects: "Marvel Contest of Champions, Disney Mirrorverse, Shop Titans"
  },
  {
    name: "Mogo",
    category: "Fintech",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://www.mogo.ca",
    linkedin: "https://www.linkedin.com/company/mogo-finance-technology-inc/",
    funding: "Public (TSX:MOGO, NASDAQ:MOGO) - Public markets, Power Financial, Difference Capital",
    revenue: "$73M (2023)",
    employeeCount: "200+",
    keyPeople: "David Feller (CEO & Founder)",
    yearFounded: 2003,
    valuation: "$100M market cap",
    shortBlurb: "Digital financial platform offering free credit score monitoring, identity fraud protection, and financial tools.",
    aiFocusAreas: ["Fintech", "Digital Banking"],
    notableProjects: "MogoMoney, MogoProtect identity protection, Moka investment platform"
  },
  {
    name: "Coinsquare",
    category: "Fintech",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://coinsquare.com",
    linkedin: "https://www.linkedin.com/company/coinsquare/",
    funding: "$83.2M (December 2021) - Mogo, Canaccord Genuity, Mavenwood Capital",
    revenue: "$50M+ (est.)",
    employeeCount: "150+",
    keyPeople: "Martin Piszel (CEO)",
    yearFounded: 2014,
    valuation: "$500M+ (peak valuation)",
    shortBlurb: "Canada's largest cryptocurrency exchange platform providing trading, staking, and digital asset services.",
    aiFocusAreas: ["Blockchain", "Cryptocurrency"],
    notableProjects: "Coinsquare exchange, CoinSmart acquisition, Institutional trading platform"
  },
  {
    name: "Nymi",
    category: "Technology Companies",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://www.nymi.com",
    linkedin: "https://www.linkedin.com/company/nymi/",
    funding: "$31M Series B - Relay Ventures, Ignition Partners, Salesforce Ventures, MasterCard",
    revenue: "$10-20M (est.)",
    employeeCount: "50-100",
    keyPeople: "Chris Sullivan (CEO)",
    yearFounded: 2011,
    shortBlurb: "Workplace wearable technology providing passwordless authentication using biometric heartbeat recognition.",
    aiFocusAreas: ["Biometrics", "Security"],
    notableProjects: "Nymi Band biometric wearable, Connected Worker Platform"
  },
  {
    name: "Carbon Engineering",
    category: "CleanTech",
    bcRegion: "Lower Mainland",
    city: "Squamish, BC",
    website: "https://carbonengineering.com",
    linkedin: "https://www.linkedin.com/company/carbon-engineering/",
    funding: "$68M (2019) - Oxy Low Carbon Ventures, Bill Gates, BHP, Chevron Technology Ventures",
    revenue: "Pre-revenue (commercializing)",
    employeeCount: "150+",
    keyPeople: "Daniel Friedmann (CEO)",
    yearFounded: 2009,
    shortBlurb: "Direct air capture technology removing CO2 from the atmosphere for carbon removal and clean fuel production.",
    aiFocusAreas: ["CleanTech", "Carbon Capture"],
    notableProjects: "Direct Air Capture plants, Air to Fuels technology"
  },
  {
    name: "Ballard Power Systems",
    category: "CleanTech",
    bcRegion: "Lower Mainland",
    city: "Burnaby, BC",
    website: "https://www.ballard.com",
    linkedin: "https://www.linkedin.com/company/ballard-power-systems/",
    funding: "Public (TSX:BLDP, NASDAQ:BLDP) - Public markets, Weichai Power, Broad-Ocean Motor",
    revenue: "$104M (2023)",
    employeeCount: "1,300+",
    keyPeople: "Randy MacEwen (CEO)",
    yearFounded: 1979,
    valuation: "$600M market cap",
    shortBlurb: "Global leader in fuel cell technology providing zero-emission solutions for buses, trucks, trains, and marine vessels.",
    aiFocusAreas: ["Clean Energy", "Fuel Cells"],
    notableProjects: "FCmove bus modules, Marine fuel cell systems, Hydrogen fuel cell stacks"
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

    // Add AI Focus Areas if available
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

async function addPhase2Companies() {
  console.log('Adding Phase 2 high-value companies to database...\n');
  
  const results = {
    added: [],
    errors: []
  };

  for (const company of phase2Companies) {
    console.log(`Adding ${company.name}...`);
    
    const result = await createOrganization(company);
    
    if (result) {
      results.added.push({
        name: company.name,
        pageId: result.id,
        category: company.category,
        funding: company.funding,
        valuation: company.valuation
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
  const reportPath = `../data/reports/${timestamp}_phase2-companies-added.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('\n=== Phase 2 Companies Addition Summary ===');
  console.log(`Added: ${results.added.length} companies`);
  console.log(`Errors: ${results.errors.length} companies`);
  
  console.log('\n=== Category Breakdown ===');
  const categories = {};
  results.added.forEach(company => {
    categories[company.category] = (categories[company.category] || 0) + 1;
  });
  Object.entries(categories).forEach(([cat, count]) => {
    console.log(`${cat}: ${count} companies added`);
  });
  
  console.log(`\nResults saved to: ${reportPath}`);
}

// Run the addition
addPhase2Companies()
  .then(() => console.log('\nPhase 2 companies addition complete!'))
  .catch(error => console.error('Error:', error));