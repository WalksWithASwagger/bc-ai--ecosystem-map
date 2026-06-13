#!/usr/bin/env node
/**
 * Analyze empty fields in BC AI database
 */

const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function analyzeEmptyFields() {
  console.log('🔍 Analyzing empty fields in BC AI database...\n');
  
  let allPages = [];
  let cursor;
  
  // Fetch all pages
  do {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      start_cursor: cursor,
      page_size: 100
    });
    
    allPages = [...allPages, ...response.results];
    cursor = response.has_more ? response.next_cursor : null;
  } while (cursor);
  
  console.log(`Total companies: ${allPages.length}`);
  
  // Count empty fields
  const fieldStats = {
    'Email': 0,
    'Year Founded': 0,
    'Funding': 0,
    'Key People': 0,
    'AI Focus Areas': 0,
    'Short Blurb': 0,
    'LinkedIn': 0,
    'Employee Count': 0,
    'Revenue': 0,
    'Website': 0
  };
  
  // Also track companies with websites but missing key data
  const needsEnrichment = [];
  
  allPages.forEach(page => {
    const props = page.properties;
    const name = props.Name?.title?.[0]?.plain_text;
    const website = props.Website?.url;
    
    if (!props.Email?.email) fieldStats['Email']++;
    if (!props['Year Founded']?.number) fieldStats['Year Founded']++;
    if (!props.Funding?.rich_text?.[0]?.plain_text) fieldStats['Funding']++;
    if (!props['Key People']?.rich_text?.[0]?.plain_text) fieldStats['Key People']++;
    if (!props['AI Focus Areas']?.multi_select?.length) fieldStats['AI Focus Areas']++;
    if (!props['Short Blurb']?.rich_text?.[0]?.plain_text) fieldStats['Short Blurb']++;
    if (!props.LinkedIn?.url) fieldStats['LinkedIn']++;
    if (!props['Employee Count']?.rich_text?.[0]?.plain_text) fieldStats['Employee Count']++;
    if (!props['Revenue']?.rich_text?.[0]?.plain_text) fieldStats['Revenue']++;
    if (!website) fieldStats['Website']++;
    
    // Track companies with websites but missing critical data
    if (website && (!props.Email?.email || !props['Year Founded']?.number)) {
      needsEnrichment.push({
        name,
        website,
        missingEmail: !props.Email?.email,
        missingYear: !props['Year Founded']?.number,
        missingFunding: !props.Funding?.rich_text?.[0]?.plain_text
      });
    }
  });
  
  // Sort by most empty
  const sorted = Object.entries(fieldStats)
    .map(([field, empty]) => ({
      field,
      empty,
      filled: allPages.length - empty,
      percentEmpty: ((empty / allPages.length) * 100).toFixed(1)
    }))
    .sort((a, b) => b.empty - a.empty);
  
  console.log('\n📊 Empty Fields Analysis:');
  console.log('Field'.padEnd(20) + ' | Empty | Filled | % Empty');
  console.log('-'.repeat(20) + '-|-------|--------|--------');
  
  sorted.forEach(stat => {
    console.log(
      stat.field.padEnd(20) + ' | ' +
      stat.empty.toString().padEnd(5) + ' | ' +
      stat.filled.toString().padEnd(6) + ' | ' +
      stat.percentEmpty.padEnd(6) + '%'
    );
  });
  
  console.log(`\n🎯 ${needsEnrichment.length} companies have websites but need enrichment`);
  console.log('\nTop 10 companies to enrich:');
  needsEnrichment.slice(0, 10).forEach(company => {
    const missing = [];
    if (company.missingEmail) missing.push('email');
    if (company.missingYear) missing.push('year');
    if (company.missingFunding) missing.push('funding');
    console.log(`- ${company.name}: Missing ${missing.join(', ')}`);
  });
  
  return needsEnrichment;
}

if (require.main === module) {
  analyzeEmptyFields().catch(console.error);
}

module.exports = { analyzeEmptyFields };