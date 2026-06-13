#!/usr/bin/env node
/**
 * Batch Import Companies to Notion Database
 * Usage: node tools/utility/batch-import-companies.js import-file.json
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');

// Configuration
let config = {};
try {
  config = require('../../config');
} catch (e) {}

const notionToken = config.NOTION_TOKEN || process.env.NOTION_TOKEN;
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

if (!notionToken || !dbId) {
  console.error('Set NOTION_TOKEN and NOTION_DATABASE_ID in config.js or env vars');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });

async function importCompanies() {
  // Get import file from command line
  const importFile = process.argv[2];
  if (!importFile) {
    console.error('Specify import JSON file as argument');
    console.error('Usage: node tools/utility/batch-import-companies.js import-file.json');
    process.exit(1);
  }
  
  // Read and parse the import file
  let companies;
  try {
    const fileContent = fs.readFileSync(importFile, 'utf8');
    companies = JSON.parse(fileContent);
    
    if (!Array.isArray(companies)) {
      throw new Error('Import file must contain an array');
    }
  } catch (error) {
    console.error(`Error reading import file: ${error.message}`);
    process.exit(1);
  }
  
  console.log(`🔄 Importing ${companies.length} companies...`);
  
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  // Import each company
  for (const company of companies) {
    try {
      // Prepare properties for Notion
      const properties = {
        'Name': {
          title: [{ text: { content: company.name } }]
        }
      };
      
      // Category
      if (company.category) {
        properties['Category'] = {
          select: { name: company.category }
        };
      }
      
      // Remove location field since it doesn't exist in the schema
      // Location info can be added to Short Blurb instead
      
      // Website
      if (company.website) {
        properties['Website'] = {
          url: company.website
        };
      }
      
      // Short Blurb (include location if available)
      if (company.shortBlurb || company.location) {
        let blurb = company.shortBlurb || '';
        if (company.location && company.location !== 'British Columbia') {
          blurb = `${blurb} Located in ${company.location}.`.trim();
        }
        properties['Short Blurb'] = {
          rich_text: [{ text: { content: blurb } }]
        };
      }
      
      // Year Founded
      if (company.yearFounded) {
        properties['Year Founded'] = {
          number: company.yearFounded
        };
      }
      
      // Funding
      if (company.funding) {
        properties['Funding'] = {
          rich_text: [{ 
            text: { 
              content: `${company.funding}\n\nSource: ${company.source}\nImported: ${new Date().toISOString()}` 
            } 
          }]
        };
      }
      
      // Create the page
      await notion.pages.create({
        parent: { database_id: dbId },
        properties
      });
      
      console.log(`✅ Imported ${company.name}`);
      results.success++;
      
    } catch (error) {
      console.error(`❌ Failed to import ${company.name}: ${error.message}`);
      results.failed++;
      results.errors.push({
        company: company.name,
        error: error.message
      });
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Create import log
  const logDir = path.join(__dirname, '../../reports');
  fs.mkdirSync(logDir, { recursive: true });
  
  const logContent = {
    timestamp: new Date().toISOString(),
    importFile: importFile,
    results: results,
    companies: companies
  };
  
  const logFile = path.join(logDir, `${new Date().toISOString().split('T')[0]}_company-import-log.json`);
  fs.writeFileSync(logFile, JSON.stringify(logContent, null, 2));
  
  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('✅ Import Complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   Successful imports: ${results.success}`);
  console.log(`   Failed imports: ${results.failed}`);
  console.log(`\n📁 Log saved to: ${logFile}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(e => {
      console.log(`   - ${e.company}: ${e.error}`);
    });
  }
}

// Run the import
importCompanies().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});