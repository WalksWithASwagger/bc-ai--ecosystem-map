const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// High-value companies missing from database
const missingCompanies = [
  {
    name: "Cmd",
    category: "Technology Companies",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://cmd.com",
    linkedin: "https://www.linkedin.com/company/cmdio/",
    funding: "Acquired by Elastic (October 2021) - Elastic, GV, Expa, Amplify Partners, Slack Fund",
    revenue: "$10M+ ARR (at acquisition)",
    employeeCount: "100-200",
    keyPeople: "Jake King (Founder & Former CEO)",
    yearFounded: 2016,
    valuation: "$320M (acquisition price)",
    shortBlurb: "Linux security platform acquired by Elastic for $320M. Provided real-time visibility and control over user activity on Linux systems.",
    aiFocusAreas: ["Cybersecurity", "Machine Learning"],
    notableProjects: "Linux security monitoring, Real-time threat detection"
  },
  {
    name: "Article",
    category: "Technology Companies",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://www.article.com",
    linkedin: "https://www.linkedin.com/company/article/",
    funding: "$66M Series D (February 2024) - Tritium Partners, Mouro Capital, Link Ventures, Altos Ventures",
    revenue: "$300M+ (2023)",
    employeeCount: "250-500",
    keyPeople: "Aidan Augustin (CEO & Co-founder)",
    yearFounded: 2013,
    shortBlurb: "Direct-to-consumer furniture e-commerce platform using technology to streamline the furniture buying experience.",
    aiFocusAreas: ["E-commerce", "Supply Chain Optimization"],
    notableProjects: "AI-powered furniture recommendations, Supply chain optimization"
  },
  {
    name: "Later",
    category: "Technology Companies",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://later.com",
    linkedin: "https://www.linkedin.com/company/latergramme/",
    funding: "$60M Series B (2024) - Madrona Venture Group, Founders Fund, Origin Ventures",
    revenue: "$50M+ ARR",
    employeeCount: "200-300",
    keyPeople: "Roger Patterson (CEO)",
    yearFounded: 2014,
    shortBlurb: "Social media marketing platform helping brands and creators schedule, publish, and analyze their content across multiple platforms.",
    aiFocusAreas: ["Social Media Analytics", "Content Optimization"],
    notableProjects: "AI-powered content scheduling, Predictive analytics for social media"
  },
  {
    name: "Saltworks Technologies",
    category: "Technology Companies",
    bcRegion: "Lower Mainland",
    city: "Richmond, BC",
    website: "https://www.saltworkstech.com",
    linkedin: "https://www.linkedin.com/company/saltworks-technologies/",
    funding: "$20M (2024) - Government and strategic investors, SDTC, BDC Capital, Chrysalix Venture Capital",
    revenue: "$20M+ (2023)",
    employeeCount: "100-200",
    keyPeople: "Ben Sparrow (CEO)",
    yearFounded: 2008,
    shortBlurb: "Industrial wastewater treatment solutions using advanced desalination and lithium extraction technologies.",
    aiFocusAreas: ["CleanTech", "Industrial IoT"],
    notableProjects: "Smart water treatment systems, Lithium extraction from brines"
  },
  {
    name: "Svante",
    category: "Technology Companies",
    bcRegion: "Lower Mainland",
    city: "Burnaby, BC",
    website: "https://svanteinc.com",
    linkedin: "https://www.linkedin.com/company/svante/",
    funding: "$318M Series E (December 2022) - Chevron Technology Ventures, United Airlines, Temasek, Samsung Ventures",
    revenue: "Pre-revenue (commercializing)",
    employeeCount: "200-300",
    keyPeople: "Claude Letourneau (President & CEO)",
    yearFounded: 2007,
    shortBlurb: "Carbon capture technology company developing solutions to capture CO2 from industrial sources and the atmosphere.",
    aiFocusAreas: ["CleanTech", "Industrial Automation"],
    notableProjects: "AI-optimized carbon capture, Industrial emissions monitoring"
  },
  {
    name: "Cohere Health Vancouver",
    category: "Technology Companies",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://www.coherehealth.com",
    linkedin: "https://www.linkedin.com/company/cohere-inc/",
    funding: "$80M Series C (March 2024) - Deerfield Management, Flare Capital Partners, Define Ventures",
    revenue: "$100M+ ARR",
    employeeCount: "50+ in BC",
    yearFounded: 2019,
    shortBlurb: "Healthcare AI platform with BC R&D center, focusing on prior authorization automation and clinical intelligence.",
    aiFocusAreas: ["Healthcare AI", "Clinical Decision Support"],
    notableProjects: "AI-powered prior authorization, Clinical decision support systems"
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

async function addMissingHighValueCompanies() {
  console.log('Adding high-value missing companies to database...\n');
  
  const results = {
    added: [],
    errors: []
  };

  for (const company of missingCompanies) {
    console.log(`Adding ${company.name}...`);
    
    const result = await createOrganization(company);
    
    if (result) {
      results.added.push({
        name: company.name,
        pageId: result.id,
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
  const reportPath = `../data/reports/${timestamp}_high-value-companies-added.json`;
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  console.log('\n=== High-Value Companies Addition Summary ===');
  console.log(`Added: ${results.added.length} companies`);
  console.log(`Errors: ${results.errors.length} companies`);
  console.log(`\nResults saved to: ${reportPath}`);
}

// Run the addition
addMissingHighValueCompanies()
  .then(() => console.log('\nHigh-value companies addition complete!'))
  .catch(error => console.error('Error:', error));