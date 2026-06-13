#!/usr/bin/env node

const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

// Configuration
const notion = new Client({
  auth: process.env.NOTION_TOKEN
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

// Companies to add with their financial intelligence
const companies = [
  {
    name: "1QB Information Technologies",
    website: "https://1qbit.com/",
    linkedin: "https://www.linkedin.com/company/1qb-information-technologies/",
    region: "Vancouver",
    keyPeople: "Andrew Fursman (CEO), Landon Downs (President)",
    products: "Quantum computing software, optimization algorithms",
    category: "Quantum Computing",
    funding: "$45M USD Total (2021) - Led by Fujitsu, participation from Accenture Ventures",
    employeeCount: "100+ (as of 2023)",
    dataSources: "Crunchbase, Company website",
    lastVerified: "2025-07-30"
  },
  {
    name: "Canalyst",
    website: "https://canalyst.com/",
    linkedin: "https://www.linkedin.com/company/canalyst/",
    region: "Vancouver",
    keyPeople: "Damir Hot (Founder & CEO), James Rife (CTO)",
    products: "Financial research platform, equity research automation",
    category: "FinTech",
    funding: "$90-100M USD Total, Acquired by Tegus (2023-03) - Strategic acquisition",
    employeeCount: "300+ (at acquisition)",
    revenue: "$30M ARR (at acquisition)",
    valuation: "Undisclosed (estimated $400-500M)",
    dataSources: "TechCrunch, Globe and Mail",
    lastVerified: "2025-07-30"
  }
];

async function addCompany(company) {
  const properties = {
    'Name': {
      title: [{ text: { content: company.name } }]
    }
  };

  // Add optional fields
  if (company.website) {
    properties['Website'] = { url: company.website };
  }
  
  if (company.linkedin) {
    properties['LinkedIn'] = { url: company.linkedin };
  }
  
  if (company.region) {
    properties['BC Region'] = {
      select: { name: company.region }
    };
  }
  
  if (company.keyPeople) {
    properties['Key People'] = {
      rich_text: [{ text: { content: company.keyPeople } }]
    };
  }
  
  if (company.products) {
    properties['Products'] = {
      rich_text: [{ text: { content: company.products } }]
    };
  }
  
  if (company.category) {
    properties['Category'] = {
      multi_select: [{ name: company.category }]
    };
  }

  // Financial intelligence fields
  if (company.funding) {
    properties['Funding'] = {
      rich_text: [{ text: { content: company.funding } }]
    };
  }
  
  if (company.revenue) {
    properties['Revenue'] = {
      rich_text: [{ text: { content: company.revenue } }]
    };
  }
  
  if (company.valuation) {
    properties['Valuation'] = {
      rich_text: [{ text: { content: company.valuation } }]
    };
  }
  
  if (company.employeeCount) {
    properties['Employee Count'] = {
      rich_text: [{ text: { content: company.employeeCount } }]
    };
  }
  
  if (company.dataSources) {
    properties['Data Sources'] = {
      rich_text: [{ text: { content: company.dataSources } }]
    };
  }
  
  if (company.lastVerified) {
    properties['Last Verified'] = {
      date: { start: company.lastVerified }
    };
  }

  try {
    const response = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties: properties
    });
    
    return { success: true, id: response.id, url: response.url };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🏢 Adding Missing Financial Intelligence Companies');
  console.log('=' .repeat(50));
  
  const report = {
    timestamp: new Date().toISOString(),
    companies: [],
    summary: {
      total: companies.length,
      successful: 0,
      failed: 0
    }
  };
  
  for (const company of companies) {
    console.log(`\n📊 Adding ${company.name}...`);
    
    const result = await addCompany(company);
    
    if (result.success) {
      console.log(`✅ Successfully added with ID: ${result.id}`);
      console.log(`   URL: ${result.url}`);
      report.companies.push({
        name: company.name,
        status: 'added',
        id: result.id,
        url: result.url
      });
      report.summary.successful++;
    } else {
      console.log(`❌ Failed to add: ${result.error}`);
      report.companies.push({
        name: company.name,
        status: 'failed',
        error: result.error
      });
      report.summary.failed++;
    }
  }
  
  // Save report
  const reportPath = path.join('data', 'reports', `add-financial-companies-${new Date().toISOString().split('T')[0]}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Summary:');
  console.log(`   Total: ${report.summary.total}`);
  console.log(`   ✅ Successful: ${report.summary.successful}`);
  console.log(`   ❌ Failed: ${report.summary.failed}`);
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { addCompany };