const { Client } = require('@notionhq/client');
const fs = require('fs');
const { NOTION_TOKEN, NOTION_DATABASE_ID } = require('./config');

const notion = new Client({ auth: NOTION_TOKEN });

// Companies that failed to add due to missing BC Region
const missingCompanies = [
  {
    name: "Bench Accounting",
    category: "Fintech",
    bcRegion: "Lower Mainland",
    city: "Vancouver, BC",
    website: "https://bench.co",
    linkedin: "https://www.linkedin.com/company/bench-accounting/",
    funding: "Shut down (January 2025) - Bain Capital Ventures, Bessemer Venture Partners, iNovia Capital, Altos Ventures",
    revenue: "$30M+ ARR (peak)",
    employeeCount: "600+ (at peak)",
    keyPeople: "Jean-Philippe Durrios (Former CEO)",
    yearFounded: 2012,
    shortBlurb: "Was North America's largest bookkeeping service for small businesses before sudden closure in January 2025.",
    notableProjects: "Online bookkeeping platform, Small business financial services"
  },
  {
    name: "Sendwithus",
    category: "Marketing Tech",
    bcRegion: "Vancouver Island",
    city: "Victoria, BC",
    website: "https://www.dyspatch.io/sendwithus",
    linkedin: "https://www.linkedin.com/company/sendwithus/",
    funding: "Acquired by Dyspatch (2021) - Dyspatch (acquirer), Y Combinator, BDC Capital",
    revenue: "$5M+ ARR (at acquisition)",
    employeeCount: "25-50",
    keyPeople: "Matt Harris (Former CEO)",
    yearFounded: 2013,
    valuation: "$20M+ (acquisition estimate)",
    shortBlurb: "Transactional email platform acquired to enhance Dyspatch's email creation suite.",
    notableProjects: "Email automation platform, Template management system"
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

async function addMissingSectorCompanies() {
  console.log('Adding missing sector companies...\n');
  
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
        category: company.category,
        funding: company.funding
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

  console.log('\n=== Addition Summary ===');
  console.log(`Added: ${results.added.length} companies`);
  console.log(`Errors: ${results.errors.length} companies`);
}

// Run the addition
addMissingSectorCompanies()
  .then(() => console.log('\nMissing companies addition complete!'))
  .catch(error => console.error('Error:', error));