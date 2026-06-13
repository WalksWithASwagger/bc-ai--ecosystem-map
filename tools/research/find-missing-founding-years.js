#!/usr/bin/env node
/**
 * Research and find founding years for BC AI organizations missing Year Founded data
 * Usage: cd tools && node research/find-missing-founding-years.js
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Use the working token from the UI route
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const dbId = process.env.AI_COMPANY_DB_ID;

// Helper to safely extract property values
function getPropertyValue(page, propName) {
  const prop = page.properties[propName];
  if (!prop) return null;

  switch (prop.type) {
    case 'title':
    case 'rich_text':
      return prop[prop.type].length > 0 && prop[prop.type][0].plain_text ? prop[prop.type][0].plain_text : null;
    case 'url':
    case 'email':
    case 'phone_number':
      return prop[prop.type] || null;
    case 'select':
      return prop.select?.name || null;
    case 'multi_select':
      return prop.multi_select.length > 0 ? prop.multi_select.map(s => s.name).join(', ') : null;
    case 'number':
      return prop.number !== null ? prop.number : null;
    case 'files':
      return prop.files.length > 0 ? true : false;
    default:
      return null;
  }
}

// Calculate priority score for organizations
function calculatePriority(org) {
  let score = 0;
  
  // High priority indicators
  if (org.website) score += 25;
  if (org.funding && !org.funding.toLowerCase().includes('unknown')) score += 30;
  if (org.linkedin) score += 20;
  if (org.size && !org.size.toLowerCase().includes('unknown')) score += 10;
  if (org.category && !org.category.toLowerCase().includes('unknown')) score += 10;
  if (org.aiFocusAreas) score += 10;
  if (org.keyPeople) score += 5;
  
  return score;
}

// Main function to find organizations missing founding years
async function findMissingFoundingYears() {
  console.log('🔍 Scanning database for organizations missing founding years...');
  
  // Query organizations without founding years but with websites or funding
  const pages = [];
  let cursor;
  let count = 0;
  
  do {
    const response = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100,
      filter: {
        and: [
          {
            property: 'Year Founded',
            number: {
              is_empty: true
            }
          },
          {
            or: [
              {
                property: 'Website',
                url: {
                  is_not_empty: true
                }
              },
              {
                property: 'Funding',
                rich_text: {
                  is_not_empty: true
                }
              }
            ]
          }
        ]
      }
    });
    
    pages.push(...response.results);
    cursor = response.has_more ? response.next_cursor : null;
    count += response.results.length;
    console.log(`Found ${count} organizations without founding years...`);
  } while (cursor);
  
  console.log(`Total organizations missing founding years (but have website/funding): ${pages.length}`);
  
  // Extract and prioritize organizations
  const organizations = pages.map(page => {
    const org = {
      id: page.id,
      name: getPropertyValue(page, 'Name') || 'Unknown Organization',
      category: getPropertyValue(page, 'Category'),
      funding: getPropertyValue(page, 'Funding'),
      size: getPropertyValue(page, 'Size'),
      website: getPropertyValue(page, 'Website'),
      linkedin: getPropertyValue(page, 'LinkedIn'),
      aiFocusAreas: getPropertyValue(page, 'AI Focus Areas'),
      keyPeople: getPropertyValue(page, 'Key People'),
      shortBlurb: getPropertyValue(page, 'Short Blurb'),
      bcRegion: getPropertyValue(page, 'BC Region'),
      cityRegion: getPropertyValue(page, 'City/Region'),
      notionUrl: page.url
    };
    
    org.priority = calculatePriority(org);
    return org;
  });
  
  // Sort by priority (highest first)
  organizations.sort((a, b) => b.priority - a.priority);
  
  // Take top 25 organizations
  const topOrganizations = organizations.slice(0, 25);
  
  console.log('\n📋 Top 25 Organizations Missing Founding Years (by priority):');
  console.log('='.repeat(60));
  
  topOrganizations.forEach((org, index) => {
    console.log(`${index + 1}. ${org.name}`);
    console.log(`   Priority Score: ${org.priority}`);
    if (org.category) console.log(`   Category: ${org.category}`);
    if (org.website) console.log(`   Website: ${org.website}`);
    if (org.funding) console.log(`   Funding: ${org.funding}`);
    if (org.linkedin) console.log(`   LinkedIn: ${org.linkedin}`);
    console.log('');
  });
  
  // Generate research file
  const timestamp = new Date().toISOString().split('T')[0];
  const researchFile = path.join(__dirname, `founding-year-research-${timestamp}.json`);
  
  const researchData = {
    generatedOn: new Date().toISOString(),
    totalMissingFoundingYears: pages.length,
    topPriorityCount: topOrganizations.length,
    organizations: topOrganizations.map(org => ({
      ...org,
      researchStatus: 'pending',
      foundedYear: null,
      verificationStatus: null,
      sources: [],
      notes: null
    }))
  };
  
  fs.writeFileSync(researchFile, JSON.stringify(researchData, null, 2));
  console.log(`📄 Research file created: ${researchFile}`);
  
  return topOrganizations;
}

// Run the script
if (require.main === module) {
  findMissingFoundingYears().catch(error => {
    console.error('❌ Error:', error.message);
    if (error.body) console.error('API Error:', error.body);
    process.exit(1);
  });
}

module.exports = { findMissingFoundingYears };