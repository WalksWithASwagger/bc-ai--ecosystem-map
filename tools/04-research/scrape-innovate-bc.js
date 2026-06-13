#!/usr/bin/env node
/**
 * Scrape Innovate BC Portfolio Companies
 * Extract funding, programs, and company data from Innovate BC's public information
 * 
 * This scraper finds:
 * - Company names and sectors
 * - Funding amounts from Innovate BC programs
 * - Program participation (Ignite, Accelerate, etc.)
 * - Links to company websites
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Create directories for logs
const logsDir = path.join(__dirname, '../../logs/scrapers');
const discoveryDir = path.join(__dirname, '../../data/discoveries');

[logsDir, discoveryDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Output files
const dateStr = new Date().toISOString().split('T')[0];
const logFile = path.join(logsDir, `${dateStr}_innovate-bc-scrape.json`);
const discoveryFile = path.join(discoveryDir, `${dateStr}_innovate-bc-companies.json`);

// Innovate BC sources to scrape
const SOURCES = {
  igniteProgram: 'https://www.innovatebc.ca/programs-for-innovators/ignite-program/',
  accelerateProgram: 'https://www.innovatebc.ca/programs-for-innovators/accelerate-program/',
  portfolioCompanies: 'https://www.innovatebc.ca/success-stories/',
  fundingRecipients: 'https://www.innovatebc.ca/news/'
};

// Company data structure
class CompanyDiscovery {
  constructor(name) {
    this.name = name;
    this.discoveredAt = new Date().toISOString();
    this.sources = [];
    this.funding = [];
    this.programs = [];
    this.website = null;
    this.sector = null;
    this.description = null;
    this.yearFounded = null;
    this.employees = null;
    this.keyPeople = [];
    this.aiRelated = false;
  }

  addFunding(amount, program, date, source) {
    this.funding.push({
      amount,
      program,
      date,
      source,
      confidence: 0.95 // High confidence for government sources
    });
  }

  addSource(url, type) {
    this.sources.push({
      url,
      type,
      scrapedAt: new Date().toISOString()
    });
  }
}

// Scrape Ignite Program recipients
async function scrapeIgniteProgram() {
  console.log('🔍 Scraping Innovate BC Ignite Program...');
  const discoveries = [];

  try {
    const response = await axios.get(SOURCES.igniteProgram, {
      headers: {
        'User-Agent': 'BC-AI-Ecosystem-Research-Bot/1.0'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Look for program recipients (adjust selectors based on actual page structure)
    $('.company-card, .recipient-list li, .success-story').each((i, elem) => {
      const companyName = $(elem).find('.company-name, h3, .title').text().trim();
      const fundingAmount = $(elem).find('.funding-amount, .grant-amount').text().trim();
      const description = $(elem).find('.description, p').text().trim();
      
      if (companyName) {
        const company = new CompanyDiscovery(companyName);
        company.addSource(SOURCES.igniteProgram, 'Innovate BC Ignite Program');
        
        // Ignite provides up to $300k
        if (fundingAmount) {
          company.addFunding(fundingAmount, 'Innovate BC Ignite', null, SOURCES.igniteProgram);
        } else {
          company.addFunding('Up to $300,000', 'Innovate BC Ignite', null, SOURCES.igniteProgram);
        }
        
        company.description = description;
        
        // Check if AI-related
        const aiKeywords = ['AI', 'artificial intelligence', 'machine learning', 'ML', 'deep learning', 'neural', 'NLP'];
        company.aiRelated = aiKeywords.some(keyword => 
          description.toLowerCase().includes(keyword.toLowerCase())
        );
        
        discoveries.push(company);
      }
    });
    
    console.log(`✅ Found ${discoveries.length} companies in Ignite Program`);
  } catch (error) {
    console.error('❌ Error scraping Ignite Program:', error.message);
  }

  return discoveries;
}

// Scrape news for funding announcements
async function scrapeFundingNews() {
  console.log('🔍 Scraping Innovate BC funding news...');
  const discoveries = [];

  try {
    const response = await axios.get(SOURCES.fundingRecipients, {
      headers: {
        'User-Agent': 'BC-AI-Ecosystem-Research-Bot/1.0'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Find news articles about funding
    $('.news-item, article, .post').each((i, elem) => {
      const title = $(elem).find('h2, h3, .title').text();
      const content = $(elem).find('.content, .excerpt, p').text();
      const date = $(elem).find('.date, time').text();
      
      // Look for funding announcements
      const fundingPattern = /\$[\d,]+[KMB]?|\d+\s*(million|thousand)/i;
      const fundingMatch = content.match(fundingPattern);
      
      if (fundingMatch && title) {
        // Extract company name from title
        const companyPattern = /^([^:,]+)(?:\s+receives|\s+awarded|\s+secures)/i;
        const companyMatch = title.match(companyPattern);
        
        if (companyMatch) {
          const companyName = companyMatch[1].trim();
          const company = new CompanyDiscovery(companyName);
          
          company.addSource($(elem).find('a').attr('href') || SOURCES.fundingRecipients, 'Innovate BC News');
          company.addFunding(fundingMatch[0], 'Innovate BC', date, 'Innovate BC News');
          
          discoveries.push(company);
        }
      }
    });
    
    console.log(`✅ Found ${discoveries.length} companies in funding news`);
  } catch (error) {
    console.error('❌ Error scraping funding news:', error.message);
  }

  return discoveries;
}

// Scrape success stories
async function scrapeSuccessStories() {
  console.log('🔍 Scraping Innovate BC success stories...');
  const discoveries = [];

  try {
    const response = await axios.get(SOURCES.portfolioCompanies, {
      headers: {
        'User-Agent': 'BC-AI-Ecosystem-Research-Bot/1.0'
      }
    });

    const $ = cheerio.load(response.data);
    
    // Extract company information from success stories
    $('.success-story, .case-study, .portfolio-company').each((i, elem) => {
      const companyName = $(elem).find('.company-name, h2, h3').first().text().trim();
      const website = $(elem).find('a[href*="http"]').attr('href');
      const description = $(elem).find('.description, .summary, p').text().trim();
      const sector = $(elem).find('.sector, .industry, .category').text().trim();
      
      if (companyName) {
        const company = new CompanyDiscovery(companyName);
        company.addSource(SOURCES.portfolioCompanies, 'Innovate BC Success Stories');
        
        company.website = website;
        company.sector = sector;
        company.description = description;
        
        // Extract any mentioned funding
        const fundingPattern = /\$[\d,]+[KMB]?|\d+\s*(million|thousand)/gi;
        const fundingMatches = description.match(fundingPattern);
        
        if (fundingMatches) {
          fundingMatches.forEach(amount => {
            company.addFunding(amount, 'Various', null, SOURCES.portfolioCompanies);
          });
        }
        
        // Check for AI/ML mentions
        const aiKeywords = ['AI', 'artificial intelligence', 'machine learning', 'ML', 'deep learning'];
        company.aiRelated = aiKeywords.some(keyword => 
          description.toLowerCase().includes(keyword.toLowerCase())
        );
        
        discoveries.push(company);
      }
    });
    
    console.log(`✅ Found ${discoveries.length} companies in success stories`);
  } catch (error) {
    console.error('❌ Error scraping success stories:', error.message);
  }

  return discoveries;
}

// Merge discoveries and remove duplicates
function mergeDiscoveries(allDiscoveries) {
  const merged = new Map();
  
  allDiscoveries.flat().forEach(company => {
    const existing = merged.get(company.name);
    
    if (existing) {
      // Merge data
      existing.sources.push(...company.sources);
      existing.funding.push(...company.funding);
      existing.programs.push(...company.programs);
      
      // Update fields if better data
      existing.website = existing.website || company.website;
      existing.sector = existing.sector || company.sector;
      existing.description = existing.description || company.description;
      existing.aiRelated = existing.aiRelated || company.aiRelated;
    } else {
      merged.set(company.name, company);
    }
  });
  
  return Array.from(merged.values());
}

// Main scraping function
async function main() {
  console.log('🚀 Starting Innovate BC scraping...');
  console.log('=' .repeat(50));
  
  const allDiscoveries = [];
  
  // Scrape all sources
  allDiscoveries.push(await scrapeIgniteProgram());
  allDiscoveries.push(await scrapeFundingNews());
  allDiscoveries.push(await scrapeSuccessStories());
  
  // Merge and deduplicate
  const uniqueCompanies = mergeDiscoveries(allDiscoveries);
  
  // Filter for AI companies
  const aiCompanies = uniqueCompanies.filter(c => c.aiRelated);
  const nonAiCompanies = uniqueCompanies.filter(c => !c.aiRelated);
  
  // Save discoveries
  const results = {
    timestamp: new Date().toISOString(),
    source: 'Innovate BC',
    totalCompanies: uniqueCompanies.length,
    aiCompanies: aiCompanies.length,
    companies: {
      ai: aiCompanies,
      other: nonAiCompanies
    },
    summary: {
      totalFundingRecords: uniqueCompanies.reduce((sum, c) => sum + c.funding.length, 0),
      companiesWithWebsites: uniqueCompanies.filter(c => c.website).length,
      companiesWithSector: uniqueCompanies.filter(c => c.sector).length
    }
  };
  
  // Write to files
  fs.writeFileSync(discoveryFile, JSON.stringify(results, null, 2));
  fs.writeFileSync(logFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    sources: SOURCES,
    scraped: {
      ignite: allDiscoveries[0].length,
      news: allDiscoveries[1].length,
      success: allDiscoveries[2].length
    },
    merged: uniqueCompanies.length
  }, null, 2));
  
  // Print summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Scraping Summary:');
  console.log(`Total companies discovered: ${uniqueCompanies.length}`);
  console.log(`AI-related companies: ${aiCompanies.length}`);
  console.log(`Funding records found: ${results.summary.totalFundingRecords}`);
  console.log(`Companies with websites: ${results.summary.companiesWithWebsites}`);
  console.log('\n🎯 Top AI Companies with Funding:');
  
  aiCompanies
    .filter(c => c.funding.length > 0)
    .slice(0, 10)
    .forEach(company => {
      console.log(`\n${company.name}`);
      company.funding.forEach(f => {
        console.log(`  💰 ${f.amount} - ${f.program}`);
      });
      if (company.website) {
        console.log(`  🌐 ${company.website}`);
      }
    });
  
  console.log(`\n✅ Results saved to: ${discoveryFile}`);
  console.log(`📝 Log saved to: ${logFile}`);
}

// Run the scraper
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { scrapeIgniteProgram, scrapeFundingNews, scrapeSuccessStories };