#!/usr/bin/env node
/**
 * Add New Companies to BC AI Ecosystem Database
 * Adds companies that don't exist in the database yet
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
require('dotenv').config();

// Configuration
let config = {};
try {
  config = require('../config');
} catch (e) {
  // Use environment variables
}

const notionToken = config.NOTION_TOKEN || process.env.NOTION_TOKEN;
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

if (!notionToken || !dbId) {
  console.error('❌ Notion credentials required');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });

// Check if company already exists
async function findOrganization(name) {
  try {
    const response = await notion.databases.query({
      database_id: dbId,
      filter: {
        property: 'Name',
        title: { equals: name }
      }
    });
    
    return response.results.length > 0 ? response.results[0] : null;
  } catch (error) {
    console.error(`Error finding ${name}:`, error.message);
    return null;
  }
}

// Add new company to database
async function addCompany(company, dryRun = true) {
  const properties = {
    'Name': {
      title: [{ text: { content: company.name } }]
    }
  };

  // Add optional fields if they exist
  if (company.location) {
    properties['City/Region'] = {
      rich_text: [{ text: { content: company.location } }]
    };
    
    // Set BC Region based on location
    let bcRegion = 'Other BC';
    if(company.location.includes('Vancouver') || company.location.includes('Burnaby') || company.location.includes('Richmond') || company.location.includes('Surrey')) {
      bcRegion = 'Lower Mainland';
    }
    properties['BC Region'] = {
      select: { name: bcRegion }
    };
  }

  if (company.category) {
    // Map to existing category options or use a generic one
    let categoryName = 'AI Companies'; // default
    if (company.category.includes('Consulting') || company.category.includes('CRM')) categoryName = 'Service Providers';
    else if (company.category.includes('DevOps') || company.category.includes('Software')) categoryName = 'Technology Companies';
    else if (company.category.includes('Biotech') || company.category.includes('Healthcare')) categoryName = 'Healthcare & Biotech';
    else if (company.category.includes('Financial') || company.category.includes('Investment')) categoryName = 'Fintech';
    else if (company.category.includes('Quantum')) categoryName = 'AI Companies';
    
    properties['Category'] = {
      select: { name: categoryName }
    };
  }

  if (company.founded) {
    // Convert to number
    const year = parseInt(company.founded);
    if (!isNaN(year)) {
      properties['Year Founded'] = {
        number: year
      };
    }
  }

  // Financial data fields
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

  if (company.keyPeople) {
    properties['Key People'] = {
      rich_text: [{ text: { content: company.keyPeople } }]
    };
  }

  if (company.products) {
    properties['Description'] = {
      rich_text: [{ text: { content: company.products } }]
    };
  }

  // Add data sources and verification
  const dataSources = [];
  if (company.investors) dataSources.push(`Investors: ${company.investors}`);
  if (company.customers) dataSources.push(`Customers: ${company.customers}`);
  if (company.notes) dataSources.push(`Notes: ${company.notes}`);
  
  if (dataSources.length > 0) {
    properties['Data Sources'] = {
      rich_text: [{ text: { content: dataSources.join(' | ') } }]
    };
  }

  properties['Last Verified'] = {
    date: { start: new Date().toISOString().split('T')[0] }
  };

  if (dryRun) {
    console.log(`   🔍 DRY RUN - Would add company with properties:`);
    console.log(`   - Name: ${company.name}`);
    if (company.location) console.log(`   - Location: ${company.location}`);
    if (company.category) console.log(`   - Category: ${company.category}`);
    if (company.funding) console.log(`   - Funding: ${company.funding.substring(0, 100)}...`);
    return { success: true, dryRun: true };
  }

  try {
    const response = await notion.pages.create({
      parent: { database_id: dbId },
      properties: properties
    });
    
    return { success: true, pageId: response.id };
  } catch (error) {
    console.error(`   ❌ Error adding ${company.name}:`, error.message);
    return { success: false, error: error.message };
  }
}

// Process companies from JSON file
async function addNewCompanies(inputFile, dryRun = true) {
  console.log('🚀 BC AI Ecosystem - Add New Companies');
  console.log('====================================\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No actual changes will be made\n');
  }
  
  // Load input file
  let companyData;
  try {
    const content = fs.readFileSync(inputFile, 'utf8');
    companyData = JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error reading input file: ${error.message}`);
    process.exit(1);
  }
  
  const companies = companyData.organizations || companyData;
  if (!Array.isArray(companies)) {
    console.error('❌ Invalid format: expected array of companies');
    process.exit(1);
  }
  
  console.log(`📋 Processing ${companies.length} companies\n`);
  
  const results = {
    processed: 0,
    added: 0,
    skipped: 0,
    errors: 0,
    newCompanies: [],
    existingCompanies: []
  };
  
  // Process each company
  for (const company of companies) {
    console.log(`🔍 Processing ${company.name}...`);
    results.processed++;
    
    // Check if already exists
    const existing = await findOrganization(company.name);
    
    if (existing) {
      console.log(`   ⏭️  Already exists in database`);
      results.skipped++;
      results.existingCompanies.push(company.name);
      continue;
    }
    
    // Add new company
    const result = await addCompany(company, dryRun);
    
    if (result.success) {
      if (result.dryRun) {
        console.log(`   ✅ Ready to add (dry run)`);
      } else {
        console.log(`   ✅ Added successfully`);
      }
      results.added++;
      results.newCompanies.push(company.name);
    } else {
      console.log(`   ❌ Failed to add: ${result.error}`);
      results.errors++;
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Generate report
  const timestamp = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const outputDir = path.join(__dirname, '../../data/research');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  let report = `# Add New Companies Report\n\n`;
  report += `*Date: ${new Date().toLocaleString()}*\n`;
  report += `*Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}*\n\n`;
  report += `## Summary\n\n`;
  report += `- **Companies Processed**: ${results.processed}\n`;
  report += `- **New Companies Added**: ${results.added}\n`;
  report += `- **Already Existed**: ${results.skipped}\n`;
  report += `- **Errors**: ${results.errors}\n\n`;
  
  if (results.newCompanies.length > 0) {
    report += `## New Companies ${dryRun ? '(Would Be Added)' : 'Added'}\n\n`;
    results.newCompanies.forEach(name => {
      report += `- ${name}\n`;
    });
    report += `\n`;
  }
  
  if (results.existingCompanies.length > 0) {
    report += `## Companies Already in Database\n\n`;
    results.existingCompanies.forEach(name => {
      report += `- ${name}\n`;
    });
    report += `\n`;
  }
  
  const reportPath = path.join(outputDir, `${timestamp}_${time}_add-companies-report.md`);
  fs.writeFileSync(reportPath, report);
  
  // Final summary
  console.log('\n📊 Processing Complete:');
  console.log(`   ✅ New companies: ${results.added}`);
  console.log(`   ⏭️  Already existed: ${results.skipped}`);
  console.log(`   ❌ Errors: ${results.errors}`);
  console.log(`\n📄 Report saved: ${reportPath}`);
  
  if (dryRun && results.added > 0) {
    console.log(`\n💡 To actually add companies, run:`);
    console.log(`   node tools/enhancement/add-new-companies.js ${inputFile} --no-dryrun`);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node add-new-companies.js <input-file.json> [--no-dryrun]');
  console.log('\nExample input format:');
  console.log(JSON.stringify({
    organizations: [
      {
        name: "Example Corp",
        location: "Vancouver",
        category: "AI/ML",
        founded: "2025-01",
        funding: "$5M Seed (2025-06) - Led by Example VC",
        revenue: "$100K (Q2 2025)",
        employeeCount: "15 (as of 2025-07)",
        keyPeople: "Jane Doe (CEO), John Smith (CTO)",
        products: "AI-powered solutions for enterprise"
      }
    ]
  }, null, 2));
  process.exit(0);
}

const inputFile = args[0];
const dryRun = !args.includes('--no-dryrun');

addNewCompanies(inputFile, dryRun).catch(console.error);