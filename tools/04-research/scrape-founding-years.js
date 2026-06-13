#!/usr/bin/env node
/**
 * Scrape Founding Years and Revenue Data
 * 
 * Searches for BC AI company founding years and revenue information from:
 * - BC Registry Services
 * - News articles and press releases
 * - Company websites
 * - LinkedIn company pages
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Create directories
const logsDir = path.join(__dirname, '../../logs/scrapers');
const dataDir = path.join(__dirname, '../../data/discoveries');
fs.mkdirSync(logsDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });

class FoundingYearDiscovery {
  constructor() {
    this.timestamp = new Date().toISOString();
    this.discoveries = [];
    this.stats = {
      searched: 0,
      foundYears: 0,
      foundRevenue: 0,
      errors: 0
    };
  }

  addDiscovery(company, year, revenue, source, confidence) {
    this.discoveries.push({
      company,
      yearFounded: year,
      revenue: revenue,
      source,
      confidence,
      discoveredAt: new Date().toISOString()
    });
    
    if (year) this.stats.foundYears++;
    if (revenue) this.stats.foundRevenue++;
  }
}

// Search for founding year in text
function extractFoundingYear(text, companyName) {
  const patterns = [
    // Founded in YYYY
    /founded\s+in\s+(\d{4})/gi,
    /established\s+in\s+(\d{4})/gi,
    /started\s+in\s+(\d{4})/gi,
    /launched\s+in\s+(\d{4})/gi,
    /incorporated\s+in\s+(\d{4})/gi,
    
    // Since YYYY
    /since\s+(\d{4})/gi,
    
    // YYYY founding/establishment
    /(\d{4})\s+founding/gi,
    /(\d{4})\s+establishment/gi,
    
    // Company-specific patterns
    new RegExp(`${companyName}.*?(?:founded|established|started|launched).*?(\\d{4})`, 'gi'),
    new RegExp(`(\\d{4}).*?${companyName}.*?(?:founded|established|started|launched)`, 'gi')
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const year = parseInt(match[0].match(/\d{4}/)[0]);
      // Sanity check - founding year should be between 1990 and current year
      if (year >= 1990 && year <= new Date().getFullYear()) {
        return year;
      }
    }
  }
  
  return null;
}

// Extract revenue information
function extractRevenue(text) {
  const patterns = [
    // Revenue patterns
    /revenue\s+of\s+\$?([\d.]+)\s*(million|billion|M|B)/gi,
    /\$?([\d.]+)\s*(million|billion|M|B)\s+in\s+revenue/gi,
    /annual\s+revenue.*?\$?([\d.]+)\s*(million|billion|M|B)/gi,
    
    // ARR patterns
    /ARR\s+of\s+\$?([\d.]+)\s*(million|billion|M|B)/gi,
    /\$?([\d.]+)\s*(million|billion|M|B)\s+ARR/gi,
    
    // Sales patterns
    /sales\s+of\s+\$?([\d.]+)\s*(million|billion|M|B)/gi,
    /\$?([\d.]+)\s*(million|billion|M|B)\s+in\s+sales/gi
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = parseFloat(match[0].match(/[\d.]+/)[0]);
      const unit = match[0].match(/(million|billion|M|B)/i)[0].toLowerCase();
      
      let multiplier = 1;
      if (unit === 'million' || unit === 'm') multiplier = 1000000;
      if (unit === 'billion' || unit === 'b') multiplier = 1000000000;
      
      return {
        amount: amount * multiplier,
        formatted: `$${amount}${unit.charAt(0).toUpperCase()}`
      };
    }
  }
  
  return null;
}

// Search Google for company information
async function searchGoogle(companyName, searchType = 'founding') {
  try {
    const query = searchType === 'founding' 
      ? `"${companyName}" BC Canada "founded" OR "established" OR "since" site:linkedin.com OR site:crunchbase.com`
      : `"${companyName}" BC Canada "revenue" OR "ARR" OR "annual revenue"`;
    
    // Note: In production, you'd want to use a proper search API
    // This is a simplified example
    console.log(`  → Searching for ${searchType} information...`);
    
    // Simulate search results
    return null;
  } catch (error) {
    return null;
  }
}

// Search company website
async function searchCompanyWebsite(website, companyName) {
  try {
    console.log(`  → Checking company website...`);
    
    // Try common about pages
    const aboutPages = ['/', '/about', '/about-us', '/company', '/our-story'];
    
    for (const page of aboutPages) {
      try {
        const url = new URL(page, website).href;
        const response = await axios.get(url, {
          timeout: 5000,
          headers: { 'User-Agent': 'BC-AI-Ecosystem-Research-Bot/1.0' }
        });
        
        const $ = cheerio.load(response.data);
        const text = $('body').text();
        
        const year = extractFoundingYear(text, companyName);
        const revenue = extractRevenue(text);
        
        if (year || revenue) {
          return { year, revenue, source: url };
        }
      } catch (e) {
        // Try next page
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

// Search LinkedIn
async function searchLinkedIn(linkedinUrl, companyName) {
  try {
    if (!linkedinUrl) return null;
    
    console.log(`  → Checking LinkedIn...`);
    
    // Note: LinkedIn requires authentication for full access
    // This is a placeholder for the approach
    return null;
  } catch (error) {
    return null;
  }
}

// Main discovery function
async function discoverFoundingYears(companies) {
  const discovery = new FoundingYearDiscovery();
  
  console.log(`\n🔍 Searching for founding years and revenue data...\n`);
  
  for (const company of companies) {
    console.log(`\n📊 Researching ${company.name}...`);
    discovery.stats.searched++;
    
    let foundYear = null;
    let foundRevenue = null;
    let bestSource = null;
    let confidence = 0;
    
    try {
      // 1. Check company website first (highest confidence)
      if (company.website) {
        const websiteData = await searchCompanyWebsite(company.website, company.name);
        if (websiteData) {
          if (websiteData.year) {
            foundYear = websiteData.year;
            bestSource = websiteData.source;
            confidence = 0.9;
            console.log(`  ✅ Found year: ${foundYear}`);
          }
          if (websiteData.revenue) {
            foundRevenue = websiteData.revenue;
            console.log(`  ✅ Found revenue: ${websiteData.revenue.formatted}`);
          }
        }
      }
      
      // 2. Search Google if needed
      if (!foundYear) {
        const googleData = await searchGoogle(company.name, 'founding');
        if (googleData) {
          foundYear = googleData.year;
          bestSource = googleData.source;
          confidence = 0.7;
        }
      }
      
      if (!foundRevenue) {
        const googleRevenue = await searchGoogle(company.name, 'revenue');
        if (googleRevenue) {
          foundRevenue = googleRevenue.revenue;
          if (!bestSource) bestSource = googleRevenue.source;
        }
      }
      
      // 3. Check LinkedIn
      if (!foundYear && company.linkedin) {
        const linkedinData = await searchLinkedIn(company.linkedin, company.name);
        if (linkedinData) {
          foundYear = linkedinData.year;
          bestSource = company.linkedin;
          confidence = 0.8;
        }
      }
      
      // Add discovery if we found something
      if (foundYear || foundRevenue) {
        discovery.addDiscovery(
          company.name,
          foundYear,
          foundRevenue,
          bestSource,
          confidence
        );
      }
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      discovery.stats.errors++;
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return discovery;
}

// Fetch companies from Notion
async function fetchCompaniesForResearch() {
  // For now, return a sample list
  // In production, this would query the Notion database
  return [
    { name: 'Clio', website: 'https://www.clio.com' },
    { name: 'Hootsuite', website: 'https://hootsuite.com' },
    { name: 'Trulioo', website: 'https://www.trulioo.com' },
    { name: 'Dapper Labs', website: 'https://www.dapperlabs.com' },
    { name: 'Traction Guest', website: 'https://tractionguest.com' },
    { name: 'Thinkific', website: 'https://www.thinkific.com' },
    { name: '1Password', website: 'https://1password.com' },
    { name: 'Copperleaf', website: 'https://www.copperleaf.com' },
    { name: 'Article', website: 'https://www.article.com' },
    { name: 'Semios', website: 'https://semios.com' }
  ];
}

// Main execution
async function main() {
  try {
    // Fetch companies
    const companies = await fetchCompaniesForResearch();
    
    // Discover founding years
    const discovery = await discoverFoundingYears(companies);
    
    // Save results
    const filename = `${new Date().toISOString().split('T')[0]}_founding-years-discovery.json`;
    const filepath = path.join(dataDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(discovery, null, 2));
    
    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ Discovery Complete!\n');
    console.log(`📊 Summary:`);
    console.log(`   Companies searched: ${discovery.stats.searched}`);
    console.log(`   Founding years found: ${discovery.stats.foundYears}`);
    console.log(`   Revenue data found: ${discovery.stats.foundRevenue}`);
    console.log(`   Errors: ${discovery.stats.errors}`);
    console.log(`\n📁 Results saved to: ${filepath}`);
    
    // Create update file for Notion
    if (discovery.discoveries.length > 0) {
      const updates = discovery.discoveries
        .filter(d => d.yearFounded)
        .map(d => ({
          name: d.company,
          yearFounded: d.yearFounded,
          revenue: d.revenue?.formatted,
          source: d.source
        }));
      
      const updateFile = path.join(dataDir, `${new Date().toISOString().split('T')[0]}_year-revenue-updates.json`);
      fs.writeFileSync(updateFile, JSON.stringify(updates, null, 2));
      console.log(`\n📝 Update file created: ${updateFile}`);
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

module.exports = { extractFoundingYear, extractRevenue };