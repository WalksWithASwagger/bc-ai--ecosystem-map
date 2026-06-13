#!/usr/bin/env node
/**
 * Add missing high-value BC companies from batch 003
 */
const { Client } = require('@notionhq/client');
const config = require('../config');

const notion = new Client({ auth: config.NOTION_TOKEN });
const dbId = config.NOTION_DATABASE_ID;

async function addMissingCompanies() {
  console.log('🚀 Adding missing high-value BC companies...\n');
  
  const companies = [
    {
      name: 'STEMCELL Technologies',
      properties: {
        'Name': { title: [{ text: { content: 'STEMCELL Technologies' } }] },
        'Website': { url: 'https://www.stemcell.com' },
        'LinkedIn': { url: 'https://www.linkedin.com/company/stemcell-technologies' },
        'Category': { select: { name: 'AI Companies' } },
        'City/Region': { rich_text: [{ text: { content: 'Vancouver' } }] },
        'BC Region': { select: { name: 'Lower Mainland' } },
        'Year Founded': { number: 1993 },
        'Size': { select: { name: 'Enterprise (250+)' } },
        'Key People': { 
          rich_text: [{ 
            text: { 
              content: 'Founder & CEO: Dr. Allen Eaves (https://www.linkedin.com/in/allen-eaves) - Hematologist, Order of Canada recipient\nPresident & COO: Dr. Sharon Louis (https://www.linkedin.com/in/sharon-louis-stemcell)' 
            } 
          }] 
        },
        'Short Blurb': {
          rich_text: [{
            text: {
              content: 'Largest private biotech in Canada with 2000+ employees globally. Founded in 1993, $500M+ annual revenue, serving 100+ countries with cell culture and separation technologies.'
            }
          }]
        },
        'Focus & Notes': {
          rich_text: [{
            text: {
              content: 'Private, profitable company | $500M+ annual revenue | 2000+ employees | 45K LinkedIn followers | Founder-owned | Scientists helping scientists'
            }
          }]
        },
        'AI Focus Areas': {
          multi_select: [
            { name: 'Cell Analysis AI' },
            { name: 'Image Recognition' },
            { name: 'Lab Automation' },
            { name: 'Life Sciences' }
          ]
        }
      }
    },
    {
      name: 'Procurify',
      properties: {
        'Name': { title: [{ text: { content: 'Procurify' } }] },
        'Website': { url: 'https://www.procurify.com' },
        'LinkedIn': { url: 'https://www.linkedin.com/company/procurify' },
        'Category': { select: { name: 'AI Companies' } },
        'City/Region': { rich_text: [{ text: { content: 'Vancouver' } }] },
        'BC Region': { select: { name: 'Lower Mainland' } },
        'Year Founded': { number: 2013 },
        'Size': { select: { name: 'Scale-up (51-250)' } },
        'Key People': { 
          rich_text: [{ 
            text: { 
              content: 'CEO: David Louie (https://www.linkedin.com/in/davidlouie) - Promoted from CPO\nCo-Founder: Aman Mann (https://www.linkedin.com/in/amanmann) - Forbes 30 Under 30\nCo-Founder: Andrew Louie' 
            } 
          }] 
        },
        'Short Blurb': {
          rich_text: [{
            text: {
              content: 'Intelligent spend management platform with 1000+ clients. Raised $50M+ including $25M Series B from Runa Capital, reporting 100% YoY growth.'
            }
          }]
        },
        'Focus & Notes': {
          rich_text: [{
            text: {
              content: 'Series B: $25M (2020) | Total raised: $50M+ | 201-500 employees | 25K LinkedIn followers | 100% YoY growth'
            }
          }]
        },
        'AI Focus Areas': {
          multi_select: [
            { name: 'Spend Analytics' },
            { name: 'Procurement AI' },
            { name: 'Financial Automation' },
            { name: 'Predictive Analytics' }
          ]
        }
      }
    },
    {
      name: 'Appnovation',
      properties: {
        'Name': { title: [{ text: { content: 'Appnovation' } }] },
        'Website': { url: 'https://www.appnovation.com' },
        'LinkedIn': { url: 'https://www.linkedin.com/company/appnovation' },
        'Category': { select: { name: 'Service Providers' } },
        'City/Region': { rich_text: [{ text: { content: 'Vancouver' } }] },
        'BC Region': { select: { name: 'Lower Mainland' } },
        'Year Founded': { number: 2007 },
        'Size': { select: { name: 'Enterprise (250+)' } },
        'Key People': { 
          rich_text: [{ 
            text: { 
              content: 'Founder & CEO: Arnold Leung (https://www.linkedin.com/in/arnoldleung) - EY Entrepreneur of the Year' 
            } 
          }] 
        },
        'Short Blurb': {
          rich_text: [{
            text: {
              content: 'Global digital consultancy with 800+ employees across 20+ offices. Acquired by Advantive in 2023, serving clients like Google, Samsung, and HSBC.'
            }
          }]
        },
        'Focus & Notes': {
          rich_text: [{
            text: {
              content: 'Acquired by Advantive (2023) | 800+ employees globally | 20+ offices | Previously raised $30M+ growth capital | 20K LinkedIn followers'
            }
          }]
        },
        'AI Focus Areas': {
          multi_select: [
            { name: 'Enterprise AI' },
            { name: 'Digital Transformation' },
            { name: 'Data Analytics' },
            { name: 'Cloud AI' }
          ]
        }
      }
    },
    {
      name: 'Tasktop',
      properties: {
        'Name': { title: [{ text: { content: 'Tasktop' } }] },
        'Website': { url: 'https://www.tasktop.com' },
        'LinkedIn': { url: 'https://www.linkedin.com/company/tasktop' },
        'Category': { select: { name: 'AI Companies' } },
        'City/Region': { rich_text: [{ text: { content: 'Vancouver' } }] },
        'BC Region': { select: { name: 'Lower Mainland' } },
        'Year Founded': { number: 2007 },
        'Size': { select: { name: 'Scale-up (51-250)' } },
        'Key People': { 
          rich_text: [{ 
            text: { 
              content: 'Founder & Former CEO: Dr. Mik Kersten (https://www.linkedin.com/in/mikkersten) - PhD, author of "Project to Product"' 
            } 
          }] 
        },
        'Short Blurb': {
          rich_text: [{
            text: {
              content: 'Value stream management pioneer acquired by Planview for $250M+ in 2023. Founded in 2007, previously raised $50M+ before exit.'
            }
          }]
        },
        'Focus & Notes': {
          rich_text: [{
            text: {
              content: 'Acquired by Planview (2023) for $250M+ | Previously raised $50M+ | 201-500 employees | Pioneer in value stream management'
            }
          }]
        },
        'AI Focus Areas': {
          multi_select: [
            { name: 'DevOps Intelligence' },
            { name: 'Value Stream Analytics' },
            { name: 'Tool Integration' },
            { name: 'Flow Metrics' }
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
addMissingCompanies().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});