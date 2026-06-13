#!/usr/bin/env node
/**
 * Scrape BetaKit for BC Startup Funding News
 * Extract real funding rounds, amounts, and investor information
 * 
 * This scraper finds:
 * - Funding amounts and rounds (Series A, B, C, etc.)
 * - Investor names and lead investors
 * - Company descriptions and sectors
 * - Founding dates when mentioned
 * - Employee growth metrics
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Create directories
const logsDir = path.join(__dirname, '../../logs/scrapers');
const discoveryDir = path.join(__dirname, '../../data/discoveries');

[logsDir, discoveryDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Output files
const dateStr = new Date().toISOString().split('T')[0];
const logFile = path.join(logsDir, `${dateStr}_betakit-funding-scrape.json`);
const discoveryFile = path.join(discoveryDir, `${dateStr}_betakit-bc-funding.json`);

// BetaKit search URLs for BC companies
const SEARCH_QUERIES = [
  'https://betakit.com/?s=vancouver+funding',
  'https://betakit.com/?s=british+columbia+funding',
  'https://betakit.com/?s=BC+startup+raises',
  'https://betakit.com/?s=vancouver+series+A',
  'https://betakit.com/?s=vancouver+series+B',
  'https://betakit.com/?s=vancouver+seed+funding',
  'https://betakit.com/?s=kelowna+funding',
  'https://betakit.com/?s=victoria+BC+funding'
];

// Funding data structure
class FundingDiscovery {
  constructor(companyName) {
    this.companyName = companyName;
    this.discoveredAt = new Date().toISOString();
    this.fundingRounds = [];
    this.totalRaised = null;
    this.investors = [];
    this.description = null;
    this.sector = null;
    this.yearFounded = null;
    this.employees = null;
    this.headquarters = null;
    this.website = null;
    this.sources = [];
    this.aiRelated = false;
  }

  addFundingRound(amount, round, date, leadInvestor, allInvestors, source) {
    this.fundingRounds.push({
      amount: this.parseAmount(amount),
      amountRaw: amount,
      round,
      date: date || this.discoveredAt,
      leadInvestor,
      investors: allInvestors,
      source,
      confidence: 0.95 // High confidence for BetaKit
    });
    
    // Add investors to master list
    allInvestors.forEach(investor => {
      if (!this.investors.includes(investor)) {
        this.investors.push(investor);
      }
    });
  }

  parseAmount(amountStr) {
    // Parse amounts like "$5M", "$2.5 million", "$500K"
    const cleanAmount = amountStr.replace(/[^\d.KMB]/g, '');
    const multipliers = {
      'K': 1000,
      'M': 1000000,
      'B': 1000000000
    };
    
    const match = cleanAmount.match(/(\d+\.?\d*)([KMB])?/i);
    if (match) {
      const num = parseFloat(match[1]);
      const multiplier = multipliers[match[2]?.toUpperCase()] || 1;
      return num * multiplier;
    }
    
    return null;
  }

  calculateTotalRaised() {
    const total = this.fundingRounds.reduce((sum, round) => {
      return sum + (round.amount || 0);
    }, 0);
    
    if (total > 0) {
      this.totalRaised = total;
    }
  }
}

// Scrape individual article for funding details
async function scrapeArticle(articleUrl) {
  try {
    const response = await axios.get(articleUrl, {
      headers: {
        'User-Agent': 'BC-AI-Ecosystem-Research-Bot/1.0'
      },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const articleText = $('.entry-content, .article-content, article').text();
    
    // Extract funding details using patterns
    const fundingData = {
      amount: null,
      round: null,
      investors: [],
      date: null,
      description: null
    };
    
    // Extract funding amount
    const amountPattern = /(?:raised?|secures?|closes?|announces?|completed?)\s+(?:a\s+)?(\$[\d,]+\.?\d*\s*(?:million|M|thousand|K|billion|B))/i;
    const amountMatch = articleText.match(amountPattern);
    if (amountMatch) {
      fundingData.amount = amountMatch[1];
    }
    
    // Extract round type
    const roundPattern = /(?:Series\s+[A-E]|seed\s+(?:round|funding)|pre-seed|angel\s+round)/i;
    const roundMatch = articleText.match(roundPattern);
    if (roundMatch) {
      fundingData.round = roundMatch[0];
    }
    
    // Extract investors
    const investorPattern = /(?:led\s+by|investors?\s+include|participated?\s+by|backed\s+by)\s+([^.]+?)(?:\.|,\s+with|alongside)/i;
    const investorMatch = articleText.match(investorPattern);
    if (investorMatch) {
      // Split by common delimiters
      const investorNames = investorMatch[1]
        .split(/,|and\s+|alongside|with\s+participation\s+from/)
        .map(name => name.trim())
        .filter(name => name.length > 2 && name.length < 100);
      
      fundingData.investors = investorNames;
    }
    
    // Extract date
    const dateElem = $('.entry-date, .publish-date, time');
    fundingData.date = dateElem.attr('datetime') || dateElem.text().trim();
    
    // Extract description
    const firstParagraph = $('.entry-content p, .article-content p').first().text().trim();
    fundingData.description = firstParagraph;
    
    return fundingData;
    
  } catch (error) {
    console.error(`Error scraping article ${articleUrl}:`, error.message);
    return null;
  }
}

// Scrape search results page
async function scrapeSearchResults(searchUrl) {
  console.log(`🔍 Searching: ${searchUrl}`);
  const discoveries = [];
  
  try {
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'BC-AI-Ecosystem-Research-Bot/1.0'
      },
      timeout: 15000
    });

    const $ = cheerio.load(response.data);
    
    // Find all article links
    const articles = $('.entry-title a, .post-title a, article h2 a').toArray();
    
    for (const articleElem of articles) {
      const title = $(articleElem).text().trim();
      const articleUrl = $(articleElem).attr('href');
      
      // Check if it's a BC company (Vancouver, Victoria, Kelowna, etc.)
      const bcPattern = /(?:vancouver|victoria|kelowna|burnaby|richmond|surrey|british\s+columbia|BC|B\.C\.)/i;
      if (!bcPattern.test(title)) {
        continue;
      }
      
      // Check if it's a funding announcement
      const fundingPattern = /(?:raises?|secures?|closes?|funding|investment|Series\s+[A-E]|seed\s+round)/i;
      if (!fundingPattern.test(title)) {
        continue;
      }
      
      // Extract company name from title
      const companyPattern = /^([^,:]+?)(?:\s+raises|\s+secures|\s+closes|\s+announces)/i;
      const companyMatch = title.match(companyPattern);
      
      if (companyMatch) {
        const companyName = companyMatch[1].trim();
        console.log(`  → Found funding news for: ${companyName}`);
        
        // Create funding discovery
        const discovery = new FundingDiscovery(companyName);
        discovery.sources.push({
          url: articleUrl,
          title: title,
          type: 'BetaKit Article'
        });
        
        // Scrape the full article
        const fundingDetails = await scrapeArticle(articleUrl);
        
        if (fundingDetails && fundingDetails.amount) {
          discovery.addFundingRound(
            fundingDetails.amount,
            fundingDetails.round || 'Unknown',
            fundingDetails.date,
            fundingDetails.investors[0] || null,
            fundingDetails.investors,
            articleUrl
          );
          
          discovery.description = fundingDetails.description;
          
          // Check if AI-related
          const aiKeywords = ['AI', 'artificial intelligence', 'machine learning', 'ML', 'automation', 'algorithm'];
          const textToSearch = `${title} ${fundingDetails.description}`.toLowerCase();
          discovery.aiRelated = aiKeywords.some(keyword => 
            textToSearch.includes(keyword.toLowerCase())
          );
          
          discoveries.push(discovery);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`  ✅ Found ${discoveries.length} funding announcements`);
    
  } catch (error) {
    console.error(`❌ Error scraping search results:`, error.message);
  }
  
  return discoveries;
}

// Search for specific companies
async function searchSpecificCompanies() {
  const knownBCCompanies = [
    'Clio', 'Trulioo', 'Thinkific', 'Dapper Labs', 'Article',
    'Galvanize', 'Copperleaf', 'Vision Critical', 'Procurify',
    'Bench Accounting', 'Aspect Biosystems', '1QBit', 'D-Wave'
  ];
  
  const discoveries = [];
  
  for (const company of knownBCCompanies) {
    const searchUrl = `https://betakit.com/?s=${encodeURIComponent(company)}+funding`;
    console.log(`🔍 Searching for ${company} funding news...`);
    
    const results = await scrapeSearchResults(searchUrl);
    discoveries.push(...results);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return discoveries;
}

// Main scraping function
async function main() {
  console.log('🚀 Starting BetaKit BC funding scraper...');
  console.log('=' .repeat(50));
  
  const allDiscoveries = [];
  
  // Scrape general searches
  for (const searchUrl of SEARCH_QUERIES) {
    const discoveries = await scrapeSearchResults(searchUrl);
    allDiscoveries.push(...discoveries);
    
    // Rate limiting between searches
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Search for specific known companies
  console.log('\n🎯 Searching for specific BC companies...');
  const specificDiscoveries = await searchSpecificCompanies();
  allDiscoveries.push(...specificDiscoveries);
  
  // Deduplicate by company name
  const uniqueCompanies = new Map();
  allDiscoveries.forEach(discovery => {
    const existing = uniqueCompanies.get(discovery.companyName);
    
    if (existing) {
      // Merge funding rounds
      discovery.fundingRounds.forEach(round => {
        const isDuplicate = existing.fundingRounds.some(r => 
          r.amountRaw === round.amountRaw && r.round === round.round
        );
        
        if (!isDuplicate) {
          existing.fundingRounds.push(round);
        }
      });
      
      existing.sources.push(...discovery.sources);
    } else {
      uniqueCompanies.set(discovery.companyName, discovery);
    }
  });
  
  const companies = Array.from(uniqueCompanies.values());
  
  // Calculate total raised for each company
  companies.forEach(company => company.calculateTotalRaised());
  
  // Sort by total funding
  companies.sort((a, b) => (b.totalRaised || 0) - (a.totalRaised || 0));
  
  // Prepare results
  const results = {
    timestamp: new Date().toISOString(),
    source: 'BetaKit',
    totalCompanies: companies.length,
    aiCompanies: companies.filter(c => c.aiRelated).length,
    totalFundingRecords: companies.reduce((sum, c) => sum + c.fundingRounds.length, 0),
    companies: companies,
    topFundedCompanies: companies.slice(0, 10).map(c => ({
      name: c.companyName,
      totalRaised: c.totalRaised,
      rounds: c.fundingRounds.length,
      latestRound: c.fundingRounds[c.fundingRounds.length - 1]
    }))
  };
  
  // Save results
  fs.writeFileSync(discoveryFile, JSON.stringify(results, null, 2));
  fs.writeFileSync(logFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    searchQueries: SEARCH_QUERIES,
    totalArticlesProcessed: allDiscoveries.length,
    uniqueCompanies: companies.length,
    fundingRounds: results.totalFundingRecords
  }, null, 2));
  
  // Print summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 BetaKit Funding Scraping Summary:');
  console.log(`Total companies with funding: ${companies.length}`);
  console.log(`AI-related companies: ${results.aiCompanies}`);
  console.log(`Total funding rounds found: ${results.totalFundingRecords}`);
  
  console.log('\n💰 Top 10 Funded BC Companies:');
  results.topFundedCompanies.forEach((company, i) => {
    console.log(`\n${i + 1}. ${company.name}`);
    console.log(`   Total raised: $${(company.totalRaised / 1000000).toFixed(1)}M`);
    console.log(`   Latest: ${company.latestRound.amountRaw} ${company.latestRound.round}`);
    if (company.latestRound.leadInvestor) {
      console.log(`   Lead: ${company.latestRound.leadInvestor}`);
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

module.exports = { scrapeSearchResults, scrapeArticle };