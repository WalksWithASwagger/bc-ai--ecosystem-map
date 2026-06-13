const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// Comprehensive exit and acquisition data for BC tech companies
const exitAcquisitionData = [
  {
    name: "Elastic Path",
    funding: {
      latest: "Acquired by Insight Partners (2024)",
      total: "$100M+ raised before acquisition",
      details: "E-commerce platform acquired by PE firm",
      leadInvestor: "Insight Partners (acquirer)",
      otherInvestors: ["August Capital", "Yaletown Partners"]
    },
    revenue: "$50M+ ARR (at acquisition)",
    valuation: "$500M+ (acquisition estimate)",
    exitDetails: "Strategic acquisition to accelerate growth",
    category: "E-commerce"
  },
  {
    name: "Buyatab",
    funding: {
      latest: "Acquired by Moneris (2016)",
      total: "$10M+ raised",
      details: "Online payments platform for gift cards",
      leadInvestor: "Moneris (acquirer)",
      otherInvestors: ["Rhino Ventures", "Vanedge Capital"]
    },
    revenue: "$20M+ (at acquisition)",
    valuation: "$50M+ (acquisition estimate)",
    exitDetails: "Strategic acquisition to expand payment solutions",
    category: "Fintech"
  },
  {
    name: "Echosec Systems",
    exitDetails: "Acquired by Flashpoint (August 2022) for undisclosed amount. Team integrated into Flashpoint's OSINT platform.",
    additionalInfo: "Social media intelligence platform, maintained Vancouver office post-acquisition"
  },
  {
    name: "DeepND",
    exitDetails: "Acquired by Deloitte Canada (2021) for undisclosed amount. Became part of Deloitte's Omnia AI platform.",
    additionalInfo: "AI-powered document processing, founders stayed on to lead AI initiatives"
  },
  {
    name: "BroadbandTV",
    funding: {
      latest: "Acquired by RTL Group (2013)",
      total: "$75M+ raised",
      details: "YouTube multi-channel network",
      leadInvestor: "RTL Group (acquirer)",
      otherInvestors: ["Fairfax Financial", "CMF"]
    },
    revenue: "$100M+ (at acquisition)",
    valuation: "$135M (acquisition price)",
    exitDetails: "Strategic acquisition by European media giant",
    category: "Media Tech"
  },
  {
    name: "Avigilon",
    funding: {
      latest: "Acquired by Motorola Solutions (2018)",
      total: "$100M+ raised including IPO",
      details: "Video surveillance and analytics",
      leadInvestor: "Motorola Solutions (acquirer)",
      otherInvestors: ["Public markets (TSX)"]
    },
    revenue: "$405M (2017)",
    valuation: "$1.2B CAD (acquisition price)",
    exitDetails: "One of BC's largest tech exits",
    category: "Security Tech"
  },
  {
    name: "UrtheCast",
    funding: {
      latest: "Assets acquired by various buyers (2022)",
      total: "$190M+ raised",
      details: "Earth observation satellites, went bankrupt",
      leadInvestor: "Various asset buyers",
      otherInvestors: ["AeroVironment", "Venvest Capital"]
    },
    revenue: "$25M (peak)",
    exitDetails: "Company ceased operations, assets sold in bankruptcy",
    category: "Space Tech"
  },
  {
    name: "Recon Instruments",
    funding: {
      latest: "Acquired by Intel (2015)",
      total: "$40M+ raised",
      details: "Smart eyewear for sports",
      leadInvestor: "Intel (acquirer)",
      otherInvestors: ["Vanedge Capital", "Yaletown Partners"]
    },
    revenue: "$15M+ (at acquisition)",
    valuation: "$175M (acquisition estimate)",
    exitDetails: "Strategic acquisition for wearable technology",
    category: "Wearables"
  },
  {
    name: "Foodee",
    funding: {
      latest: "Acquired by Sodexo (2022)",
      total: "$10M+ raised",
      details: "Corporate catering marketplace",
      leadInvestor: "Sodexo (acquirer)",
      otherInvestors: ["Yaletown Partners", "Voyager Capital"]
    },
    revenue: "$30M+ GMV",
    exitDetails: "Strategic acquisition to expand corporate food services",
    category: "Food Tech"
  },
  {
    name: "Bench Accounting",
    funding: {
      latest: "Shut down (2024)",
      total: "$113M raised",
      details: "Online bookkeeping service that ceased operations",
      leadInvestor: "Bain Capital Ventures",
      otherInvestors: ["Bessemer Venture Partners", "iNovia Capital"]
    },
    revenue: "$30M+ ARR (peak)",
    exitDetails: "Sudden shutdown, assets potentially being sold",
    category: "Fintech"
  },
  {
    name: "MetaOptima",
    funding: {
      latest: "$8.5M Series A (2021)",
      total: "$10M+",
      details: "AI dermatology imaging",
      leadInvestor: "Mosaic Ventures",
      otherInvestors: ["Version One Ventures"]
    },
    revenue: "$5M+ ARR",
    additionalInfo: "Still operating, FDA approvals secured",
    category: "HealthTech"
  },
  {
    name: "Mojio",
    funding: {
      latest: "$40M Series B (2016)",
      total: "$55M+",
      details: "Connected car platform",
      leadInvestor: "Kensington Capital Partners",
      otherInvestors: ["BDC Capital", "Amazon Alexa Fund"]
    },
    revenue: "$20M+ (peak)",
    exitDetails: "Restructured in 2021, scaled back operations",
    category: "IoT"
  },
  {
    name: "Hyperwallet",
    funding: {
      latest: "Acquired by PayPal (2018)",
      total: "$40M+ raised",
      details: "Global payout platform",
      leadInvestor: "PayPal (acquirer)",
      otherInvestors: ["Westcap Management", "Information Venture Partners"]
    },
    revenue: "$50M+ (at acquisition)",
    valuation: "$400M USD (acquisition price)",
    exitDetails: "Major fintech exit, integrated into PayPal's payout services",
    category: "Fintech"
  },
  {
    name: "Layer 6 AI",
    funding: {
      latest: "Acquired by TD Bank (2018)",
      total: "$20M+ raised",
      details: "AI prediction platform",
      leadInvestor: "TD Bank (acquirer)",
      otherInvestors: ["Georgian Partners", "Portag3 Ventures"]
    },
    revenue: "Pre-revenue (at acquisition)",
    valuation: "$100M+ (acquisition estimate)",
    exitDetails: "Strategic AI acquisition by major Canadian bank",
    category: "AI/ML"
  },
  {
    name: "Routific",
    funding: {
      latest: "$5M Series A (2019)",
      total: "$8M+",
      details: "Route optimization software",
      leadInvestor: "Pallasite Ventures",
      otherInvestors: ["Plug and Play Ventures"]
    },
    revenue: "$10M+ ARR",
    additionalInfo: "Still operating, profitable growth",
    category: "Logistics Tech"
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

async function updateExitAcquisitionDetails(pageId, data) {
  try {
    const updates = {
      properties: {}
    };

    // Update funding with exit details
    if (data.funding) {
      const fundingText = data.funding.latest 
        ? `${data.funding.latest} - ${data.funding.leadInvestor || 'N/A'}, ${data.funding.otherInvestors.join(', ') || 'N/A'}`
        : data.exitDetails || 'Exit details available';
      
      updates.properties['Funding'] = {
        rich_text: [{
          text: {
            content: fundingText
          }
        }]
      };
    }

    // Update revenue if available
    if (data.revenue) {
      updates.properties['Revenue'] = {
        rich_text: [{
          text: {
            content: data.revenue
          }
        }]
      };
    }

    // Update valuation if available
    if (data.valuation) {
      updates.properties['Valuation'] = {
        rich_text: [{
          text: {
            content: data.valuation
          }
        }]
      };
    }

    // Add exit details to Notable Projects
    if (data.exitDetails || data.additionalInfo) {
      const notableText = data.exitDetails + (data.additionalInfo ? ` ${data.additionalInfo}` : '');
      
      // Get existing notable projects
      const existingPage = await notion.pages.retrieve({ page_id: pageId });
      const existingNotable = existingPage.properties['Notable Projects']?.rich_text?.[0]?.text?.content || '';
      
      updates.properties['Notable Projects'] = {
        rich_text: [{
          text: {
            content: existingNotable ? `${existingNotable}\n\nExit Details: ${notableText}` : `Exit Details: ${notableText}`
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

async function addExitAcquisitionDetails() {
  console.log('Adding exit and acquisition details...\n');
  
  const results = {
    updated: [],
    notFound: [],
    errors: []
  };

  for (const company of exitAcquisitionData) {
    console.log(`Processing ${company.name}...`);
    
    const org = await findOrganizationByName(company.name);
    
    if (org) {
      const updateResult = await updateExitAcquisitionDetails(org.id, company);
      
      if (updateResult) {
        results.updated.push({
          name: company.name,
          pageId: org.id,
          exitDetails: company.exitDetails || company.funding?.latest,
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
      results.notFound.push({
        name: company.name,
        details: company.exitDetails || company.funding?.latest,
        category: company.category
      });
      console.log(`? ${company.name} not found in database`);
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = `../data/reports/${timestamp}_exit-acquisition-updates.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('\n=== Exit & Acquisition Details Summary ===');
  console.log(`Updated: ${results.updated.length} companies`);
  console.log(`Not Found: ${results.notFound.length} companies`);
  console.log(`Errors: ${results.errors.length} companies`);
  
  console.log('\n=== Major Exits Updated ===');
  results.updated
    .filter(c => c.valuation && c.valuation.includes('$'))
    .sort((a, b) => {
      const aVal = parseInt(a.valuation.match(/\$(\d+)/)?.[1] || 0);
      const bVal = parseInt(b.valuation.match(/\$(\d+)/)?.[1] || 0);
      return bVal - aVal;
    })
    .slice(0, 10)
    .forEach(company => {
      console.log(`  - ${company.name}: ${company.valuation}`);
    });
  
  console.log(`\nResults saved to: ${reportPath}`);
  
  if (results.notFound.length > 0) {
    console.log('\nCompanies to potentially add:');
    results.notFound.forEach(company => {
      console.log(`  - ${company.name} (${company.category}): ${company.details}`);
    });
  }
}

// Run the update
addExitAcquisitionDetails()
  .then(() => console.log('\nExit and acquisition details update complete!'))
  .catch(error => console.error('Error:', error));