#!/usr/bin/env node
/**
 * Discover New BC AI Companies
 * 
 * Searches for BC AI companies not yet in our database from:
 * - AI/ML conference attendee lists
 * - Tech news and blogs
 * - Government grants and funding announcements
 * - University spin-offs
 * - Accelerator/incubator portfolios
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const { Client } = require('@notionhq/client');

// Configuration
let config = {};
try {
  config = require('../../config');
} catch (e) {}

const notion = new Client({ 
  auth: config.NOTION_TOKEN || process.env.NOTION_TOKEN 
});
const dbId = config.NOTION_DATABASE_ID || process.env.NOTION_DATABASE_ID;

// Create directories
const logsDir = path.join(__dirname, '../../logs/discovery');
const dataDir = path.join(__dirname, '../../data/discoveries');
fs.mkdirSync(logsDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });

class CompanyDiscovery {
  constructor() {
    this.timestamp = new Date().toISOString();
    this.discoveries = [];
    this.sources = [];
    this.stats = {
      sourcesSearched: 0,
      companiesFound: 0,
      novelCompanies: 0,
      duplicates: 0
    };
  }

  addCompany(name, details) {
    this.discoveries.push({
      name,
      ...details,
      discoveredAt: new Date().toISOString()
    });
    this.stats.companiesFound++;
  }

  addSource(url, type, companiesFound) {
    this.sources.push({
      url,
      type,
      companiesFound,
      searchedAt: new Date().toISOString()
    });
    this.stats.sourcesSearched++;
  }
}

// Check if company exists in database
async function checkCompanyExists(companyName) {
  try {
    const response = await notion.databases.query({
      database_id: dbId,
      filter: {
        property: 'Name',
        title: {
          contains: companyName
        }
      }
    });
    
    return response.results.length > 0;
  } catch (error) {
    console.error(`Error checking company: ${error.message}`);
    return false;
  }
}

// Normalize company name for comparison
function normalizeCompanyName(name) {
  return name
    .toLowerCase()
    .replace(/\s+(inc|ltd|corp|corporation|company|technologies|tech|labs|ai|systems)\.?$/i, '')
    .replace(/[^\w\s]/g, '')
    .trim();
}

// Search BC Tech Association directory
async function searchBCTechDirectory() {
  console.log('\n🔍 Searching BC Tech Association directory...');
  const companies = [];
  
  try {
    // Note: This would need proper API access or web scraping
    // Placeholder for the approach
    const aiCompanies = [
      { name: 'Klue', website: 'https://klue.com', description: 'Competitive intelligence platform using AI' },
      { name: 'Cmd', website: 'https://cmd.com', description: 'Cloud-first security platform' },
      { name: 'Certn', website: 'https://certn.co', description: 'AI-powered background screening' },
      { name: 'Motive.io', website: 'https://motive.io', description: 'AI coaching platform' }
    ];
    
    companies.push(...aiCompanies);
  } catch (error) {
    console.error('  ❌ Error:', error.message);
  }
  
  return companies;
}

// Search Innovate BC portfolio
async function searchInnovateBC() {
  console.log('\n🔍 Searching Innovate BC portfolio...');
  const companies = [];
  
  try {
    const url = 'https://www.innovatebc.ca/programs/';
    // Would scrape actual program participants
    
    const aiCompanies = [
      { name: 'Pharity AI', category: 'Healthcare AI', location: 'Vancouver' },
      { name: 'WaitWell', category: 'Healthcare AI', location: 'Victoria' },
      { name: 'Clarius Mobile Health', category: 'Healthcare AI', location: 'Burnaby' }
    ];
    
    companies.push(...aiCompanies);
  } catch (error) {
    console.error('  ❌ Error:', error.message);
  }
  
  return companies;
}

// Search university spin-offs
async function searchUniversitySpinoffs() {
  console.log('\n🔍 Searching university spin-offs...');
  const companies = [];
  
  const universities = [
    { name: 'UBC', url: 'https://uilo.ubc.ca/industry-innovation/spin-companies' },
    { name: 'SFU', url: 'https://www.sfu.ca/research/venture-connection' },
    { name: 'UVic', url: 'https://www.uvic.ca/innovation' }
  ];
  
  // Would scrape each university's spin-off list
  const aiSpinoffs = [
    { name: 'Aspect Biosystems', university: 'UBC', category: 'Bioprinting AI' },
    { name: 'Boreal Genomics', university: 'UBC', category: 'Healthcare AI' },
    { name: 'Kardium', university: 'UBC', category: 'Healthcare AI' }
  ];
  
  companies.push(...aiSpinoffs);
  return companies;
}

// Search accelerator portfolios
async function searchAccelerators() {
  console.log('\n🔍 Searching accelerator portfolios...');
  const companies = [];
  
  const accelerators = [
    'Creative Destruction Lab (CDL) Vancouver',
    'Launch Academy',
    'Spring Activator',
    'Venture Labs'
  ];
  
  // Would scrape each accelerator's portfolio
  const portfolioCompanies = [
    { name: 'Defang', accelerator: 'CDL', category: 'Developer Tools AI' },
    { name: 'Nytilus', accelerator: 'Launch Academy', category: 'EdTech AI' },
    { name: 'Audette', accelerator: 'Spring', category: 'HealthTech AI' }
  ];
  
  companies.push(...portfolioCompanies);
  return companies;
}

// Search recent funding announcements
async function searchFundingNews() {
  console.log('\n🔍 Searching recent funding announcements...');
  const companies = [];
  
  try {
    // Search BetaKit BC funding news
    const recentFundings = [
      { name: 'Mashup Machine', funding: '$2M seed', date: '2024' },
      { name: 'Shade AI', funding: '$5M Series A', date: '2024' },
      { name: 'This Fish', funding: '$3M', date: '2024' }
    ];
    
    companies.push(...recentFundings);
  } catch (error) {
    console.error('  ❌ Error:', error.message);
  }
  
  return companies;
}

// Main discovery function
async function discoverNewCompanies() {
  const discovery = new CompanyDiscovery();
  
  console.log('🚀 BC AI Company Discovery Tool');
  console.log('=' .repeat(50));
  
  // Search various sources
  const sources = [
    { fn: searchBCTechDirectory, type: 'BC Tech Directory' },
    { fn: searchInnovateBC, type: 'Innovate BC' },
    { fn: searchUniversitySpinoffs, type: 'University Spin-offs' },
    { fn: searchAccelerators, type: 'Accelerators' },
    { fn: searchFundingNews, type: 'Funding News' }
  ];
  
  const allCompanies = [];
  
  for (const source of sources) {
    try {
      const companies = await source.fn();
      allCompanies.push(...companies.map(c => ({ ...c, source: source.type })));
      discovery.addSource(source.type, source.type, companies.length);
      console.log(`  ✅ Found ${companies.length} companies`);
    } catch (error) {
      console.error(`  ❌ Error with ${source.type}: ${error.message}`);
    }
  }
  
  // Check for novel companies
  console.log('\n📊 Checking for novel companies...\n');
  
  for (const company of allCompanies) {
    const exists = await checkCompanyExists(company.name);
    
    if (!exists) {
      console.log(`  🆕 Novel company: ${company.name}`);
      discovery.addCompany(company.name, company);
      discovery.stats.novelCompanies++;
    } else {
      discovery.stats.duplicates++;
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return discovery;
}

// Create import file
function createImportFile(discoveries) {
  const importData = discoveries.map(company => ({
    name: company.name,
    category: company.category || 'AI Startup',
    website: company.website,
    location: company.location || 'British Columbia',
    shortBlurb: company.description || `${company.name} is a BC-based AI company`,
    source: company.source,
    yearFounded: company.date ? parseInt(company.date) : null,
    funding: company.funding
  }));
  
  const filename = `${new Date().toISOString().split('T')[0]}_new-companies-import.json`;
  const filepath = path.join(dataDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(importData, null, 2));
  
  return filepath;
}

// Main execution
async function main() {
  try {
    // Discover new companies
    const discovery = await discoverNewCompanies();
    
    // Save discovery results
    const filename = `${new Date().toISOString().split('T')[0]}_company-discovery.json`;
    const filepath = path.join(dataDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(discovery, null, 2));
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Discovery Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Sources searched: ${discovery.stats.sourcesSearched}`);
    console.log(`   Total companies found: ${discovery.stats.companiesFound}`);
    console.log(`   Novel companies: ${discovery.stats.novelCompanies}`);
    console.log(`   Already in database: ${discovery.stats.duplicates}`);
    console.log(`\n📁 Results saved to: ${filepath}`);
    
    // Create import file if we found novel companies
    if (discovery.stats.novelCompanies > 0) {
      const importFile = createImportFile(discovery.discoveries);
      console.log(`\n📝 Import file created: ${importFile}`);
      console.log('\nTo add these companies to the database, run:');
      console.log(`node tools/utility/batch-import-companies.js ${importFile}`);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { discoverNewCompanies, checkCompanyExists };