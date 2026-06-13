#!/usr/bin/env node
/**
 * Test enrichment on specific companies
 */

const { findEmail, findYear, findAIFocus, validate } = require('./unified-enrichment');

async function testCompanies() {
  const testCompanies = [
    { name: 'Clio', website: 'https://www.clio.com' },
    { name: 'Hootsuite', website: 'https://hootsuite.com' },
    { name: 'Trulioo', website: 'https://www.trulioo.com' },
    { name: 'Chimp', website: 'https://chimp.net' },
    { name: 'Dapper Labs', website: 'https://www.dapperlabs.com' }
  ];
  
  console.log('🧪 Testing Enrichment Functions\n');
  
  for (const company of testCompanies) {
    console.log(`\n📊 ${company.name} (${company.website})`);
    
    // Test email
    console.log('  → Finding email...');
    const emailData = await findEmail(company);
    if (emailData) {
      console.log(`  ✅ Email: ${emailData.email} (${emailData.source}, ${(emailData.confidence * 100).toFixed(0)}%)`);
    } else {
      console.log('  ❌ No email found');
    }
    
    // Test year
    console.log('  → Finding year...');
    const yearData = await findYear(company);
    if (yearData) {
      console.log(`  ✅ Founded: ${yearData.year} (${yearData.source})`);
    } else {
      console.log('  ❌ No year found');
    }
    
    // Test AI focus
    console.log('  → Finding AI focus...');
    const focusData = await findAIFocus(company);
    if (focusData) {
      console.log(`  ✅ AI Focus: ${focusData.areas.join(', ')}`);
    } else {
      console.log('  ❌ No AI focus found');
    }
    
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

testCompanies().catch(console.error);