#!/usr/bin/env node
/**
 * Add Trulioo and Thinkific to database
 */
const { Client } = require('@notionhq/client');
const config = require('../config');

const notion = new Client({ auth: config.NOTION_TOKEN });
const dbId = config.NOTION_DATABASE_ID;

async function addRemainingCompanies() {
  console.log('🚀 Adding Trulioo and Thinkific to database...\n');
  
  const companies = [
    {
      name: 'Trulioo',
      properties: {
        'Name': { title: [{ text: { content: 'Trulioo' } }] },
        'Website': { url: 'https://www.trulioo.com' },
        'LinkedIn': { url: 'https://www.linkedin.com/company/trulioo' },
        'Category': { select: { name: 'AI Companies' } },
        'City/Region': { rich_text: [{ text: { content: 'Vancouver' } }] },
        'BC Region': { select: { name: 'Lower Mainland' } },
        'Year Founded': { number: 2011 },
        'Size': { select: { name: 'Enterprise (250+)' } },
        'Key People': { 
          rich_text: [{ 
            text: { 
              content: 'CEO: Steve Munford\nFounder: Stephen Ufford' 
            } 
          }] 
        },
        'Short Blurb': {
          rich_text: [{
            text: {
              content: 'Global identity verification unicorn valued at $1.75B. Founded in 2011, raised $476M+ including $394M Series D from TCV and Goldman Sachs. Leading RegTech platform for KYC/AML compliance.'
            }
          }]
        },
        'Focus & Notes': {
          rich_text: [{
            text: {
              content: 'Series D: $394M (2021) | Valuation: $1.75B (Unicorn) | Total raised: $476M+ | 501-1000 employees | Backed by TCV, Goldman Sachs, Citi Ventures | 15K LinkedIn followers | Twitter: @trulioo'
            }
          }]
        },
        'AI Focus Areas': {
          multi_select: [
            { name: 'Identity Verification' },
            { name: 'Machine Learning' },
            { name: 'Fraud Detection' },
            { name: 'RegTech' }
          ]
        }
      }
    },
    {
      name: 'Thinkific',
      properties: {
        'Name': { title: [{ text: { content: 'Thinkific' } }] },
        'Website': { url: 'https://www.thinkific.com' },
        'LinkedIn': { url: 'https://www.linkedin.com/company/thinkific' },
        'Category': { select: { name: 'AI Companies' } },
        'City/Region': { rich_text: [{ text: { content: 'Vancouver' } }] },
        'BC Region': { select: { name: 'Lower Mainland' } },
        'Year Founded': { number: 2012 },
        'Size': { select: { name: 'Scale-up (51-250)' } },
        'Key People': { 
          rich_text: [{ 
            text: { 
              content: 'CEO & Co-Founder: Greg Smith (https://www.linkedin.com/in/gregdsmith)\nCo-Founder: Matt Payne\nCo-Founder: Matt Smith\nCo-Founder: Miranda Lievers' 
            } 
          }] 
        },
        'Short Blurb': {
          rich_text: [{
            text: {
              content: 'EdTech platform for online course creation. Founded in 2012, went public on TSX in 2021 (THNC), serving 50,000+ course creators globally with AI-powered course creation tools.'
            }
          }]
        },
        'Focus & Notes': {
          rich_text: [{
            text: {
              content: 'Public company (TSX: THNC) | IPO 2021 | Market cap ~$150M CAD | 201-500 employees | Online course platform | 25K LinkedIn followers | Twitter: @thinkific'
            }
          }]
        },
        'AI Focus Areas': {
          multi_select: [
            { name: 'EdTech' },
            { name: 'Content Recommendation' },
            { name: 'Learning Analytics' },
            { name: 'Course Creation AI' }
          ]
        }
      }
    }
  ];
  
  const results = {
    success: [],
    failed: []
  };
  
  for (const company of companies) {
    try {
      console.log(`Adding ${company.name}...`);
      
      const response = await notion.pages.create({
        parent: { database_id: dbId },
        properties: company.properties
      });
      
      console.log(`✅ Successfully added ${company.name} (ID: ${response.id})`);
      results.success.push({
        name: company.name,
        id: response.id
      });
      
    } catch (error) {
      console.error(`❌ Failed to add ${company.name}: ${error.message}`);
      results.failed.push({
        name: company.name,
        error: error.message
      });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Summary:');
  console.log(`✅ Successfully added: ${results.success.length} companies`);
  console.log(`❌ Failed: ${results.failed.length} companies`);
  
  if (results.success.length > 0) {
    console.log('\nNew company IDs:');
    results.success.forEach(company => {
      console.log(`- ${company.name}: ${company.id}`);
    });
  }
  
  return results;
}

// Run the script
addRemainingCompanies().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});