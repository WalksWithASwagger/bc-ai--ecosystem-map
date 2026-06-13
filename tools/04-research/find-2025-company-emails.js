#!/usr/bin/env node
/**
 * Find emails for 2025-founded BC AI companies
 * Focuses on the newest companies first
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
const { discoverEmail } = require('./advanced-email-finder');

// Configuration
let config = {};
try {
  config = require('../../config');
} catch (e) {}

const notion = new Client({ 
  auth: config.NOTION_TOKEN || process.env.NOTION_TOKEN 
});
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

async function find2025CompanyEmails() {
  console.log('🚀 Finding emails for 2025-founded companies\n');
  
  // Query for 2025 companies
  const response = await notion.databases.query({
    database_id: dbId,
    filter: {
      and: [
        {
          property: 'Year Founded',
          number: { equals: 2025 }
        },
        {
          property: 'Website',
          url: { is_not_empty: true }
        },
        {
          property: 'Email',
          email: { is_empty: true }
        }
      ]
    }
  });
  
  console.log(`Found ${response.results.length} companies from 2025 needing emails\n`);
  
  const results = [];
  
  for (const page of response.results) {
    const company = {
      id: page.id,
      name: page.properties.Name?.title[0]?.plain_text,
      website: page.properties.Website?.url,
      yearFounded: 2025,
      category: page.properties.Category?.select?.name
    };
    
    const emailData = await discoverEmail(company);
    
    if (emailData) {
      // Update in Notion
      try {
        await notion.pages.update({
          page_id: company.id,
          properties: {
            'Email': { email: emailData.primary }
          }
        });
        
        console.log(`  ✅ Updated ${company.name} with ${emailData.primary}\n`);
        
        results.push({
          company: company.name,
          email: emailData.primary,
          confidence: emailData.confidence,
          source: emailData.source
        });
      } catch (error) {
        console.error(`  ❌ Failed to update: ${error.message}\n`);
      }
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Save results
  const reportPath = path.join(__dirname, '../../data/email-discovery/2025-companies-emails.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    companies: results
  }, null, 2));
  
  console.log(`\n✅ Complete! Found emails for ${results.length} companies`);
  console.log(`📁 Report saved to: ${reportPath}`);
}

// Run
find2025CompanyEmails().catch(console.error);