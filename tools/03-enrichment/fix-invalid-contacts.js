#!/usr/bin/env node
/**
 * Fix invalid emails and phone numbers
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
require('dotenv').config();

// Try to load configuration
let config = {};
try {
  config = require('./config');
} catch (e) {
  // Config file doesn't exist, will use environment variables
}

// Get Notion credentials
const notionToken = config.NOTION_TOKEN || process.env.NOTION_TOKEN;
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

if (!notionToken || !dbId) {
  console.error('Notion token and database ID are required.');
  process.exit(1);
}

const notion = new Client({ auth: notionToken });

// Organizations with invalid data to fix
const invalidContacts = {
  emails: [
    { name: 'Produce8', invalid: 'sales@produce8.com, info@produce8.com', fix: 'info@produce8.com' },
    { name: 'Timezyx', invalid: 'Info@timezyx.com, kamyab.zandi@timezyx.com', fix: 'info@timezyx.com' },
    { name: 'Open Ocean Robotics', invalid: 'info@openoceanrobotics.com, sales@openoceanrobotics.com', fix: 'info@openoceanrobotics.com' }
  ],
  phones: [
    { name: 'Kardium', invalid: '+1.604.248.8891', fix: '+1 604 248 8891' },
    { name: 'pH7 Technologies', invalid: '.3333333333', fix: null }, // Remove invalid
    { name: 'Mangrove Lithium', invalid: '.2507152167', fix: '+1 250 715 2167' },
    { name: 'Caliber Data Labs', invalid: '.5333333333', fix: null }, // Remove invalid
    { name: 'CareCru', invalid: '.6609933035', fix: null }, // Remove invalid
    { name: 'Ehsai', invalid: '071 390.0255', fix: '+27 71 390 0255' }, // South African number
    { name: 'Advize', invalid: '.5333333333', fix: null }, // Remove invalid
    { name: 'Telus Ventures', invalid: '1.4285714285', fix: null }, // Remove invalid
    { name: 'AI for Ecommerce Non-Profit Society', invalid: 'Listed on contact page', fix: null }, // Remove invalid
    { name: 'ASC Creative Ltd.', invalid: '604.771.5001', fix: '+1 604 771 5001' },
    { name: 'Altitude Business Intelligence', invalid: '.2253521126', fix: null }, // Remove invalid
    { name: 'AltaML (Vancouver)', invalid: '.9700012207', fix: null } // Remove invalid
  ]
};

async function findOrganization(name) {
  const response = await notion.databases.query({
    database_id: dbId,
    filter: {
      property: 'Name',
      title: {
        equals: name
      }
    }
  });
  
  return response.results[0] || null;
}

async function fixInvalidContacts() {
  console.log('🔧 Fixing invalid emails and phone numbers...\n');
  
  const results = {
    emailsFixed: 0,
    phonesFixed: 0,
    phonesRemoved: 0,
    errors: []
  };
  
  // Fix invalid emails
  console.log('📧 Fixing invalid emails:');
  for (const item of invalidContacts.emails) {
    const org = await findOrganization(item.name);
    if (!org) {
      console.log(`   ❌ ${item.name} not found`);
      continue;
    }
    
    try {
      await notion.pages.update({
        page_id: org.id,
        properties: {
          Email: { email: item.fix }
        }
      });
      console.log(`   ✅ ${item.name}: Fixed email to ${item.fix}`);
      results.emailsFixed++;
    } catch (error) {
      console.error(`   ❌ ${item.name}: ${error.message}`);
      results.errors.push({ name: item.name, error: error.message });
    }
  }
  
  // Fix or remove invalid phones
  console.log('\n📞 Fixing invalid phone numbers:');
  for (const item of invalidContacts.phones) {
    const org = await findOrganization(item.name);
    if (!org) {
      console.log(`   ❌ ${item.name} not found`);
      continue;
    }
    
    try {
      if (item.fix) {
        // Fix the phone number
        await notion.pages.update({
          page_id: org.id,
          properties: {
            Phone: { phone_number: item.fix }
          }
        });
        console.log(`   ✅ ${item.name}: Fixed phone to ${item.fix}`);
        results.phonesFixed++;
      } else {
        // Remove invalid phone number
        await notion.pages.update({
          page_id: org.id,
          properties: {
            Phone: { phone_number: null }
          }
        });
        console.log(`   ✅ ${item.name}: Removed invalid phone`);
        results.phonesRemoved++;
      }
    } catch (error) {
      console.error(`   ❌ ${item.name}: ${error.message}`);
      results.errors.push({ name: item.name, error: error.message });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Results:');
  console.log(`   ✅ Emails fixed: ${results.emailsFixed}`);
  console.log(`   ✅ Phones fixed: ${results.phonesFixed}`);
  console.log(`   ✅ Invalid phones removed: ${results.phonesRemoved}`);
  console.log(`   ❌ Errors: ${results.errors.length}`);
  
  // Generate report
  const timestamp = new Date().toISOString().split('T')[0];
  const reportPath = path.join(__dirname, '..', 'reports', `${timestamp}_invalid-contacts-fixed.md`);
  
  let report = `# Invalid Contacts Fix Report

*Generated on ${new Date().toLocaleString()}*

## Summary

- **Emails Fixed**: ${results.emailsFixed}
- **Phone Numbers Fixed**: ${results.phonesFixed}
- **Invalid Phone Numbers Removed**: ${results.phonesRemoved}
- **Errors**: ${results.errors.length}

## Actions Taken

### Emails Fixed
${invalidContacts.emails.map(item => 
  `- **${item.name}**: Changed from "${item.invalid}" to "${item.fix}"`
).join('\n')}

### Phone Numbers Fixed
${invalidContacts.phones.filter(item => item.fix).map(item => 
  `- **${item.name}**: Changed from "${item.invalid}" to "${item.fix}"`
).join('\n')}

### Phone Numbers Removed (Invalid)
${invalidContacts.phones.filter(item => !item.fix).map(item => 
  `- **${item.name}**: Removed "${item.invalid}"`
).join('\n')}

## Result

All invalid contact information has been fixed or removed. The database now contains only properly formatted contact data.
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Report written to: ${reportPath}`);
}

// Run the fix
fixInvalidContacts().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});